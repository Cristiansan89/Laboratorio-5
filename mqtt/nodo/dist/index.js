const mqtt = require("mqtt");
const cliente = mqtt.connect('mqtt://localhost:1883');

cliente.on('connect', () => {
  console.log('Conectado al broker MQTT');

  const intervalo = 10000; // intervalo de milisegundos

  // Cada 10 segundos
  setInterval(() => {
    // Se simula el envío de un tópico con un ID aleatorio
    const id = Math.floor(Math.random() * 3) + 1;

    // Valor aleatorio a enviar
    const valor = Math.floor(Math.random() * 40);

    // Mensaje a enviar en formato JSON
    const mensaje = JSON.stringify({ valor: valor });

    // Publicar mensaje en el tópico "datos/{id}"
    cliente.publish(`datos/${id}`, mensaje);

    console.log(`Nuevo mensaje publicado por el ID ${id}: ${mensaje}`);
  }, intervalo);
});

// Manejo de conexión perdida
cliente.on('close', () => {
  console.log('Conexión cerrada. Intentando conectar...');
});

cliente.on('offline', () => {
  console.log('Desconectado. Intentando reconectar...');
});

// Cierre seguro
process.on('SIGINT', () => {
  console.log('\nDesconectando del broker MQTT...');
  cliente.end();
  process.exit();
});
