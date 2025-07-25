const mqtt = require("mqtt");
const axios = require("axios");

// Configuración
const MQTT_BROKER_URL = "mqtt://broker.emqx.io";
const MQTT_TOPIC = "MEDBAND";
const BACKEND_URL = "https://doctorpenabackend-production-8dd4.up.railway.app/api/wearable/upload";

const client = mqtt.connect(MQTT_BROKER_URL);

client.on("connect", () => {
  console.log(`Conectado a MQTT en ${MQTT_BROKER_URL}`);
  client.subscribe(MQTT_TOPIC, (err) => {
    err
      ? console.error("Error al suscribirse:", err.message)
      : console.log(`Suscrito a topic: ${MQTT_TOPIC}`);
  });
});

client.on("message", async (_topic, message) => {
  try {
    const rawData = message.toString();
    console.log("Mensaje RAW:", rawData);

    let data;
    try {
      data = JSON.parse(rawData);
    } catch {
      return console.warn("Mensaje no es JSON válido");
    }

    console.log("Datos recibidos:", data);	

    // Verificar estructura mínima
    if (
      !data.registration_number ||
      data.bpm === undefined ||
      data.spo2 === undefined ||
      data.temp === undefined
    ) {
      return console.warn("Falta registration_number o datos de sensores");
    }

    // Función para limpiar valores
    const cleanValue = (val) => {
      if (val === "---" || val === -1) return null;
      return parseFloat(val);
    };

    const bpm = cleanValue(data.bpm);
    const spo2 = cleanValue(data.spo2);
    const temp = cleanValue(data.temp);

    // Validar datos
    if ([bpm, spo2, temp].some((val) => val === null)) {
      return console.warn("Datos incompletos o inválidos");
    }

    // Payload a enviar al backend
    const payload = {
      registration_number: data.registration_number,
      heart_rate: bpm,
      oxygenation: spo2,
      temperature: temp,
    };

    console.log("Enviando al backend:", payload);

    const response = await axios.post(BACKEND_URL, payload);

    console.log("Respuesta del backend:", response.data.message || "OK");
  } catch (error) {
    console.error("Error procesando mensaje:", error.message);

    if (error.response) {
      console.error("Detalles del error:", error.response.data);
    }
  }
});
