const { query } = require('../config/db.sql');

// Verificar si existe una consulta
async function consultationExists(consultation_id) {
  const [res] = await query('SELECT id FROM Consultations WHERE id = ?', [consultation_id]);
  return res.length > 0;
}

// Registrar signos vitales
exports.createVitalSigns = async (req, res) => {
  try {
    const {
      consultation_id,
      temperature,
      heart_rate,
      oxygenation,
      blood_pressure,
      weight,
      height
    } = req.body;

    // Validar que la consulta exista
    if (!(await consultationExists(consultation_id))) {
      return res.status(400).json({ error: 'Consulta no encontrada' });
    }

    // Verificar si ya existen signos vitales para esta consulta
    const [exists] = await query('SELECT id FROM VitalSigns WHERE consultation_id = ?', [consultation_id]);
    if (exists.length > 0) {
      return res.status(409).json({ error: 'Ya existen signos vitales registrados para esta consulta' });
    }

    // Registrar los signos vitales
    await query(
      `INSERT INTO VitalSigns 
      (consultation_id, temperature, heart_rate, oxygenation, blood_pressure, weight, height)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [consultation_id, temperature, heart_rate, oxygenation, blood_pressure, weight, height]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Signos vitales registrados exitosamente' 
    });
  } catch (err) {
    console.error('Error al registrar signos vitales:', err);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
};

// Obtener signos vitales por consulta
exports.getVitalSignsByConsultation = async (req, res) => {
  try {
    const consultation_id = req.params.consultation_id;
    const [rows] = await query('SELECT * FROM VitalSigns WHERE consultation_id = ?', [consultation_id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'No se encontraron signos vitales para esta consulta' 
      });
    }
    
    res.json({ 
      success: true, 
      vital_signs: rows[0] 
    });
  } catch (err) {
    console.error('Error al obtener signos vitales:', err);
    res.status(500).json({ 
      error: 'Error al obtener los signos vitales' 
    });
  }
};

// Actualizar signos vitales
exports.updateVitalSigns = async (req, res) => {
  try {
    const consultation_id = req.params.consultation_id;
    const {
      temperature,
      heart_rate,
      oxygenation,
      blood_pressure,
      weight,
      height
    } = req.body;

    // Verificar si existen signos vitales para actualizar
    const [exists] = await query('SELECT id FROM VitalSigns WHERE consultation_id = ?', [consultation_id]);
    if (exists.length === 0) {
      return res.status(404).json({ 
        error: 'No hay signos vitales registrados para esta consulta' 
      });
    }

    // Actualizar los signos vitales
    await query(
      `UPDATE VitalSigns SET 
      temperature = ?, 
      heart_rate = ?, 
      oxygenation = ?, 
      blood_pressure = ?, 
      weight = ?, 
      height = ?
      WHERE consultation_id = ?`,
      [temperature, heart_rate, oxygenation, blood_pressure, weight, height, consultation_id]
    );

    res.json({ 
      success: true, 
      message: 'Signos vitales actualizados exitosamente' 
    });
  } catch (err) {
    console.error('Error al actualizar signos vitales:', err);
    res.status(500).json({ 
      error: 'Error al actualizar los signos vitales' 
    });
  }
};