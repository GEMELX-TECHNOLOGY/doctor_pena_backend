const express = require('express');
const router = express.Router();
const { admin, db } = require('../config/firebase');
const mysql = require('../config/db.sql');
const { queryHuggingFace } = require('../utils/huggingfaceClient');

async function generarMensajePersonalizado(historial, signosVitales) {
  const prompt = `
   Eres un asistente médico. El objetivo es brindar recomendaciones personalizadas al paciente según sus signos vitales actuales y su historial de alertas previas.

   1. Explica si los signos vitales están fuera del rango normal.
   2. Informa con lenguaje sencillo si hay un riesgo para la salud.
   3. Da al menos 2 recomendaciones claras para el paciente.
   4. Si es grave, sugiere buscar atención médica inmediata.

   Historial reciente de alertas del paciente:
   ${historial}

   Signos vitales actuales del paciente:
   Frecuencia cardíaca: ${signosVitales.heart_rate} bpm
   Oxigenación: ${signosVitales.oxygenation}%
   Temperatura: ${signosVitales.temperature} °C

    Escribe el mensaje directamente para el paciente:
  `;

  try {
    const mensaje = await queryHuggingFace(prompt);
    return mensaje;
  } catch (error) {
    console.error('❌ Error generando texto con Hugging Face:', error);
    return null;
  }
}


const analizarSignosVitales = ({ heart_rate, oxygenation, temperature }) => {
  if (heart_rate > 120 || oxygenation < 90 || temperature > 38.5 || temperature < 35) {
    return 'alto riesgo';
  }
  return 'normal';
};

router.post('/upload', async (req, res) => {
  const { registration_number, heart_rate, oxygenation, temperature } = req.body;

  console.log(' Datos recibidos:', req.body);

  try {
    // Buscar paciente
    const [rows] = await mysql.query('SELECT * FROM Patients WHERE registration_number = ?', [registration_number]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado en la base de datos MySQL' });
    }

    const paciente = rows[0];
    const riesgo = analizarSignosVitales({ heart_rate, oxygenation, temperature });

    let mensajeIA = null;
    if (riesgo !== 'normal') {
      const [alertasPrevias] = await mysql.query(
        'SELECT message FROM Alerts WHERE recipient_id = ? ORDER BY date DESC LIMIT 5',
        [paciente.user_id]
      );

      const historial = alertasPrevias.map(a => a.message).join('\n') || "Sin historial previo.";
      mensajeIA = await generarMensajePersonalizado(historial, { heart_rate, oxygenation, temperature });

      await mysql.query(
        'INSERT INTO Alerts (type, recipient_id, message) VALUES (?, ?, ?)',
        ['ia', paciente.user_id, mensajeIA || `Riesgo detectado: ${riesgo}`]
      );
    }

    let isEmergency = false;
    if (
      temperature < 35 || temperature > 38.5 ||
      heart_rate < 50 || heart_rate > 120 ||
      oxygenation < 90
    ) {
      isEmergency = true;
      await mysql.query(
        'INSERT INTO Alerts (type, recipient_id, message) VALUES (?, ?, ?)',
        ['emergencia', paciente.user_id, `Emergencia detectada para el paciente ${paciente.first_name} ${paciente.last_name}`]
      );
    }

    const newData = {
      patient_id: registration_number,
      heart_rate,
      oxygenation,
      temperature,
      isEmergency,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    console.log(" Guardando en Firebase:", newData);
    console.log(" Proyecto Firebase:", admin.app().options.credential.projectId);

    await db.collection('WearableData').add(newData)
      .then(ref => {
        console.log("✅ Documento agregado con ID:", ref.id);
        res.json({
          message: 'Datos guardados correctamente en Firestore',
          data: newData,
          patient: {
            id: paciente.id,
            name: `${paciente.first_name} ${paciente.last_name}`
          },
          iaMessage: mensajeIA || 'Sin riesgos detectados'
        });
      })
      .catch(err => {
        console.error("❌ Error al guardar en Firestore:", err);
        res.status(500).json({ error: 'Error al guardar en Firebase' });
      });

  } catch (error) {
    console.error('❌ Error general al procesar:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
