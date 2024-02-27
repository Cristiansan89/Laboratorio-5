# Laboratorio 5 – Almacenamiento Clave Valor Escalable y MQTT

## Tarea

Cree un servidor y un cliente gRPC que se comuniquen correctamente entre sí cumplimentando lo solicitado en el enunciado del laboratorio.

## Metas

- Escribir un archivo proto que defina un servicio RPC
- Generar archivos go desde un archivo proto
- Enviar solicitudes de gRPC del cliente al servidor

### Parte 1:
1. Instalar protoc en su máquina local.
2. Cree su archivo protobuf. Asegúrese de nombrar el paquete igual que sus otros archivos.
3. Ejecute <code>make build</code> en el directorio del proyecto para generar los archivos go.


### Parte 2: Servidor y cliente

Implementar lo faltante.

## Construir binarios

- Vaya a `cmd/cliente` o `cmd/servidor` y ejecute `go build .`. Esto generará archivos binarios de cliente o servidor respectivamente.

## Pruebas

- `go test ./...` debería ejecutar todas las pruebas que desarrollen, las mismas deben verificar los casos planteados en el laboratorio.

## Parte 3: MQTT

- Instalar Mosquitto para el broker MQTT

## Parte 4: NodeJS

- Instalar NodeJS
- Implementar los faltante para mqtt
 a. Implemente para el nodo broker en el código nodo/dist/index.js
 b. Implemente para el servidor broker en el código servidor/dist/index.js

## Ejecutar MQTT

- Ejecutar los index del nodo y del servidor por separado mediante el comando: node index.js
- Probar consulta de base de datos del cliente, en HTTP del navegador: localhost:3000/datos/#
- datos/#: Corresponde al topico del datos/id_nodo

# Consignas

1. El almacenamiento clave, valor debe almacenar asociando a cada clave un conjunto de valores.
2. La clave se corresponde al id de cada nodo. Los valores están compuestos de una marca de tiempo y un valor aleatorio.
3. El valor aleatorio es enviado por los nodos usando MQTT, la marca de tiempo es obtenida al momento de llegada del mensaje MQTT.
4. Los nodos deben usar un tópico datos/id_nodo.
5. Los nodos que conforman el sistema de almacenamiento clave-valor debe escuchar en el tópico datos/# al llegar un dato deben analizar si les corresponde almacenar la clave y si es asi guardarla.
6. Por otro lado deben usar de base el cliente el siguiente código para realizar consultas a la base de datos.

