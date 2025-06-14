const express = require('express');
const router = express.Router();
const { admin, db } = require('../config/firebase');
const mysql = require('../config/db.sql');

router.post('/upload', async (req, res) => {
  const { registration_number, heart_rate, oxygenation, temperature } = req.body;

  try {
    // Validar si el número de registro existe en MySQL
    const [rows] = await mysql.query('SELECT * FROM Patients WHERE registration_number = ?', [registration_number]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found in MySQL database' });
    }

    // Calcular si es emergencia
    let isEmergency = false;

    if (
      temperature < 35 || temperature > 38.5 ||
      heart_rate < 50 || heart_rate > 120 ||
      oxygenation < 90
    ) {
      isEmergency = true;
      
      // Crear alerta de emergencia en la base de datos
      await mysql.query(
        'INSERT INTO Alerts (type, recipient_id, message) VALUES (?, ?, ?)',
        ['emergencia', rows[0].user_id, `Emergency detected for patient ${rows[0].first_name} ${rows[0].last_name}`]
      );
    }

    // Crear el objeto con los datos para guardar en Firestore
    const newData = {
      patient_id: registration_number,
      heart_rate,
      oxygenation,
      temperature,
      isEmergency,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    // Guardar en Firestore en la colección 'WearableData'
    await db.collection('WearableData').add(newData);

    res.json({ 
      message: 'Data saved successfully in Firestore', 
      data: newData,
      patient: {
        id: rows[0].id,
        name: `${rows[0].first_name} ${rows[0].last_name}`
      }
    });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;