const mqtt = require('mqtt');
const axios = require('axios');

// Configuración
const MQTT_BROKER_URL = 'mqtt://broker.hivemq.com';
const MQTT_TOPIC = 'salud/sensores';
const BACKEND_URL = 'http://localhost:3000/api/wearable/upload';

const client = mqtt.connect(MQTT_BROKER_URL);

client.on('connect', () => {
    console.log(`Conectado a MQTT en ${MQTT_BROKER_URL}`);
    client.subscribe(MQTT_TOPIC, (err) => {
        err 
            ? console.error('Error al suscribirse:', err.message)
            : console.log(` Suscrito a topic: ${MQTT_TOPIC}`);
    });
});

client.on('message', async (topic, message) => {
    try {
        const data = JSON.parse(message.toString());
        console.log(' Datos recibidos:', data);

        // Verificar estructura del mensaje
        if (!data.token || !data.sensors) {
            return console.warn(' Estructura de mensaje inválida');
        }

        const payload = {
            registration_number: null, 
            heart_rate: parseFloat(data.sensors.bpm),
            oxygenation: parseFloat(data.sensors.spo2),
            temperature: parseFloat(data.sensors.temp)
        };

        // Validar datos
        if (isNaN(payload.heart_rate) || isNaN(payload.oxygenation) || isNaN(payload.temperature)) {
            return console.warn(' Datos de sensores inválidos');
        }

        console.log('Enviando al backend:', payload);
        const response = await axios.post(BACKEND_URL, payload, {
            headers: {
                Authorization: `Bearer ${data.token}`
            }
        });
        
        console.log(' Respuesta del backend:', response.data.message || 'OK');

    } catch (error) {
        console.error(' Error procesando mensaje:', error.message);
        
        if (error.response) {
            console.error(' Detalles del error:', error.response.data);
        }
    }
});