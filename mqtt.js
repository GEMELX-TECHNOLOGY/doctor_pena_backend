const mqtt = require('mqtt');
const axios = require('axios');

// Configuraciones
const MQTT_BROKER_URL = 'mqtt://broker.hivemq.com';
const MQTT_TOPIC = 'salud/sensores';
const BACKEND_URL = 'http://localhost:3000/api/wearable/upload';

// HAY QUE CAMBIAR ESTE VALOR EN LA PETICION
let REGISTRATION_NUMBER = 'PAC48796';

const client = mqtt.connect(MQTT_BROKER_URL);

client.on('connect', () => {
  console.log(`✅ Conectado a MQTT en ${MQTT_BROKER_URL}`);
  client.subscribe(MQTT_TOPIC, (err) => {
    if (err) {
      console.error('Error al suscribirse:', err.message);
    } else {
      console.log(` Suscrito a topic: ${MQTT_TOPIC}`);
    }
  });
});

client.on('message', async (topic, message) => {
  try {
    const datos = JSON.parse(message.toString());
    console.log(' Datos recibidos del ESP32:', datos);

    const { bpm, spo2, temp } = datos;

    const heart_rate = parseFloat(bpm);
    const oxygenation = parseFloat(spo2);
    const temperature = parseFloat(temp);

    if (isNaN(heart_rate) || isNaN(oxygenation) || isNaN(temperature)) {
      return console.warn(' Datos inválidos:', datos);
    }

    const payload = {
      registration_number: REGISTRATION_NUMBER,
      heart_rate,
      oxygenation,
      temperature
    };

    const response = await axios.post(BACKEND_URL, payload);
    console.log('✅ Enviado al backend:', response.data.message || 'OK');

  } catch (error) {
    console.error(' Error procesando mensaje o enviando al backend:', error.message);
  }
});
