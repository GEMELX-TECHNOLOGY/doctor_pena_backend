const tf = require("@tensorflow/tfjs");

// Valores "normales" basados en rangos clínicos medios
const normalMeans = tf.tensor2d([[80, 97, 37]]); // 80 bpm, 97% SpO₂, 37°C

function analizarSignosVitales({ heart_rate, oxygenation, temperature }) {
  const input = tf.tensor2d([[heart_rate, oxygenation, temperature]]);
  const diff = tf.sub(input, normalMeans).abs();

  // Podemos también examinar cada señal individualmente
  const [dHR, dSpO2, dTemp] = diff.arraySync()[0];

  const distanciaTotal = diff.sum().arraySync();

  let riesgo = "normal";
  if (distanciaTotal > 15) riesgo = "riesgo moderado";
  if (distanciaTotal > 30) riesgo = "riesgo alto";

  return {
    riesgo,
    detalles: {
      frecuencia_cardiaca: dHR,
      oxigenacion: dSpO2,
      temperatura: dTemp,
      distanciaTotal
    }
  };
}

module.exports = { analizarSignosVitales };
