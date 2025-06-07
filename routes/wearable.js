// routes/wearable.js
const express = require('express');
const router = express.Router();
const WearableData = require('../models/mongo/WearableData');
const mysql = require('../config/db.sql'); // Ajusta la ruta según tu estructura

router.post('/upload', async (req, res) => {
  const { matricula, heartRate, bloodOxygen, temperature } = req.body;

  try {
    // Validar si la matrícula existe en MySQL
    const [rows] = await mysql.query('SELECT * FROM Pacientes WHERE matricula = ?', [matricula]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado en MySQL' });
    }

   
        // Calcular si es emergencia
    let isEmergency = false;

    if (
      temperature < 35 || temperature > 38.5 ||
      heartRate < 50 || heartRate > 120 ||
      bloodOxygen < 90
    ) {
      isEmergency = true;
    }

    if (
      temperature < 35 || temperature > 38.5 ||
      heartRate < 50 || heartRate > 120 ||
      bloodOxygen < 90
    ) {
      isEmergency = true;
    }

    const nuevoDato = new WearableData({
      pacienteId: matricula,
      heartRate,
      bloodOxygen,
      temperature,
      isEmergency
    });

    await nuevoDato.save();

    res.json({ message: 'Datos guardados correctamente', data: nuevoDato });
  } catch (error) {
    console.error('Error al guardar datos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
