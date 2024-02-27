"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = { enumerable: true, get: function () { return m[k]; } };
  }
  Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
}));

var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
  Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
  o["default"] = v;
});

var __importStar = (this && this.__importStar) || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
  __setModuleDefault(result, mod);
  return result;
};

var __importDefault = (this && this.__importDefault) || function (mod) {
  return (mod && mod.__esModule) ? mod : { "default": mod };
};

Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mqtt = __importStar(require("mqtt"));

// ----------------------------------------------------------------------------------
const express = require('express');
//const mqtt = require('mqtt');

// definiendo express y puerto
const app = express();
const puerto = 3000;

// arreglo de dispositivos
let dispositivos = [];

// conexión a broker MQTT
const cliente = mqtt.connect('mqtt://localhost:1883');

// definiendo la ruta
app.get('/', (req, res) => {
  res.send('Servidor');
});

// ruta para todos los datos /datos/id
app.get('/datos/:id', (req, res) => {
  // recupero id, pasando a integer
  const idBuscado = parseInt(req.params.id);
  // busco el dispositivo por id (idBuscado)
  const dispositivoEncontrado = dispositivos.find(buscado => buscado.id === idBuscado);

  // si se encuentra devuelvo estado actual del dispositivo
  if (dispositivoEncontrado) {
    res.send(dispositivoEncontrado.datos);
  } else {
    // devuelvo el error
    res.status(404).json({ message: `Dispositivo con id ${idBuscado} no encontrado.` });
  }
});

// ruta para el ultimo datos guardado /datos/id
app.get('/datos_actual/:id', (req, res) => {
  // recupero id, pasando a integer
  const idBuscado = parseInt(req.params.id);
  // busco el dispositivo por id (idBuscado)
  const dispositivoEncontrado = dispositivos.find(buscado => buscado.id === idBuscado);

  // si se encuentra devuelvo estado actual del dispositivo
  if (dispositivoEncontrado) {
    const ultimoDato = dispositivoEncontrado.datos[dispositivoEncontrado.datos.length - 1];
    res.send(ultimoDato);
  } else {
    // devuelvo el error
    res.status(404).json({ message: `Dispositivo con id ${idBuscado} no encontrado.` });
  }
});

// al conectarse al broker
cliente.on('connect', () => {
  console.log('[Servidor] Conectado al broker MQTT');
  // client.subscribe('topic', {qos: valor})
  cliente.subscribe('datos/#', (err, granted) => {
    if (err) {
      console.error('[Servidor] Error al suscribirse a datos/#', err);
    } else {
      console.log('[Servidor] Suscrito a datos/#', granted);
    }
  });
});

// al recibir un mensase
cliente.on('message', (topico, mensaje) => {
  // imprimo mensaje recibido
  console.log(`[Servidor] Mensaje recibido. Tópico: ${topico}, Mensaje: ${mensaje.toString()}`);
  // paso a formato JSON
  // devuelve un tipo any, se pueden usar bibliotecas como zod para validaciones
  const dato = JSON.parse(mensaje.toString());
  // genero una constante de tipo JSON
  const datos = { clave: dato.clave, valor: dato.valor };

  // recupero id, pasando a integer (el id viene en el topico)
  const idBuscado = parseInt(topico.substring(6));
  // busco el dispositivo por id (idBuscado)
  let dispositivoEncontrado = dispositivos.find(buscado => buscado.id === idBuscado);

  // si se encuentra agrego medicion al dispositivo
  if (dispositivoEncontrado) {
    dispositivoEncontrado.datos.push(datos);
  } else {
    // creo dispositivo
    dispositivoEncontrado = { id: idBuscado, datos: [datos] };
    // agrego al arreglo de dispositivos
    dispositivos.push(dispositivoEncontrado);
  }

  console.log(`[Servidor] Nuevo valor agregado: ${datos.valor}`);
});

// escucho por peticiones
app.listen(puerto, () => {
  console.log(`[Servidor] Servidor ejecutándose en el puerto: ${puerto}`);
});

// Cierre seguro
process.on('SIGINT', () => {
  console.log('\nDesconectando del broker MQTT...');
  cliente.end();
  process.exit();
});