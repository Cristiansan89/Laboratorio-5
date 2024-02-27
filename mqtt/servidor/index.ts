import express, { Express, Request, Response } from 'express';
import * as mqtt from 'mqtt';

// Tipos de datos
interface Dato {
    clave: number;
    valor: number;
}

interface Dispositivo {
    id : number;
    datos: Dato[];
}

// arreglo de dispositivos
let  dispositivos : Dispositivo[] = [];

// defino express y puerto
const app: Express = express();
const puerto : number = 3000;

// conexión a broker MQTT
const cliente = mqtt.connect('mqtt://localhost:1883');

// defino rutas
app.get('/', (req: Request, res: Response) => {
    res.send('Servidor');
});

app.get('/datos/:id', (req: Request, res: Response) => {
    // recupero id, pasando a integer
    const idBuscado : number = parseInt(req.params.id);
    // busco el dispositivo por id (idBuscado)
    const dispositivoEncontrado = dispositivos.find(buscado => buscado.id === idBuscado);
    // si se encuentra devuelvo datos del dispositivo
    if (dispositivoEncontrado) {
        res.send(dispositivoEncontrado.datos);
    } else {
        // sino devuelvo error
        res.status(404).json({ message: `Dispositivo con id ${idBuscado} no encontrado.`});
    }
});

app.get('/datos_actuales/:id', (req: Request, res: Response) => {
    // recupero id, pasando a integer
    const idBuscado : number = parseInt(req.params.id);
    // busco el dispositivo por id (idBuscado)
    const dispositivoEncontrado = dispositivos.find(buscado => buscado.id === idBuscado);
    // si se encuentra devuelvo estado actual del dispositivo
    if (dispositivoEncontrado) {
        res.send(dispositivoEncontrado.datos[dispositivoEncontrado.datos.length-1]);
    } else {
        // sino devuelvo error
        res.status(404).json({ message: `Dispositivo con id ${idBuscado} no encontrado.`});
    }
});

// al conectarse al broker
cliente.on('connect', () => {
    console.log('[Servidor] Conectado al broker MQTT');
    cliente.subscribe('dato/#', console.log); // client.subscribe('topic', {qos: valor})
});

// al recibir un mensase
cliente.on('message', (topico : string, mensaje : Buffer) => {
    // controlo tópico
    if (topico.indexOf('dato') !== -1) {
        // imprimo mensaje recibido
        console.log(`[Servidor] Mensaje recibido: ${mensaje}. Topico: ${topico}`);

        // paso a formato JSON
        // devuelve un tipo any, se pueden usar bibliotecas como zod para validaciones
        const datos = JSON.parse(mensaje.toString());

        // genero una constante de tipo JSON
        const dato : Dato = {
            clave : datos.clave, // campo clave del mensaje en formato JSON
            valor : datos.valor, // campo valor del mensaje en formato JSON
        };

        // recupero id, pasando a integer (el id viene en el topico)
        const idBuscado : number = parseInt(topico.substring(9));
        // busco el dispositivo por id (idBuscado)
        let dispositivoEncontrado = dispositivos.find(buscado => buscado.id === idBuscado);
        // si se encuentra agrego medicion al dispositivo
        if (dispositivoEncontrado) {
            dispositivoEncontrado.datos.push(dato);
        } else {
            // creo dispositivo
            dispositivoEncontrado = {
                id : idBuscado,
                datos : []
            };
            // agrego al arreglo de dispositivos
            dispositivos.push(dispositivoEncontrado);
            // agrego medicion
            dispositivoEncontrado.datos.push(dato);
        }
        console.log(`[Servidor] Nuevo datos agregado: ${idBuscado} - ${datos.clave} - ${datos.valor}`);
    }
});

// escucho por peticiones
app.listen(puerto, () => {
    console.log(`[Servidor] Servidor ejecuntandose en el puerto: ${puerto}`);
});