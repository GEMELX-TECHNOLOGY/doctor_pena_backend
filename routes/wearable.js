const express = require('express');
const router = express.Router();
const { admin, db } = require('../config/firebase'); // Importa admin y db
const mysql = require('../config/db.sql'); // MySQL para validar paciente



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

    // Crear el objeto con los datos para guardar en Firestore
    const nuevoDato = {
      pacienteId: matricula,
      heartRate,
      bloodOxygen,
      temperature,
      isEmergency,
      timestamp: admin.firestore.FieldValue.serverTimestamp() // Marca la fecha/hora del servidor
    };

    // Guardar en Firestore en la colección 'WearableData'
    await db.collection('WearableData').add(nuevoDato);

    res.json({ message: 'Datos guardados correctamente en Firestore', data: nuevoDato });
  } catch (error) {
    console.error('Error al guardar datos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
