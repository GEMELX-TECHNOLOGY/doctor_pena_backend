const tf = require('@tensorflow/tfjs');

// Simulación: valores normales promedio para entrenamiento
const normalRanges = tf.tensor2d([
  [70, 98, 36.5], 
]);

// Función para calcular "distancia" del valor actual al normal
function analizarSignosVitales({ heart_rate, oxygenation, temperature }) {
  const input = tf.tensor2d([[heart_rate, oxygenation, temperature]]);
  const distancia = tf.sub(input, normalRanges).abs().sum().arraySync();

  let riesgo = 'normal';
  if (distancia > 15) {
    riesgo = 'riesgo moderado';
  }
  if (distancia > 30) {
    riesgo = 'riesgo alto';
  }

  return riesgo;
}

module.exports = { analizarSignosVitales };