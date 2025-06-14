const { query } = require('../config/db.sql');

// Crear un nuevo antecedente familiar
exports.createFamilyHistory = async (req, res) => {
  try {
    const { patient_id, disease, relative, notes } = req.body;

    await query(
      `INSERT INTO FamilyHistory (patient_id, disease, relative, notes)
       VALUES (?, ?, ?, ?)`,
      [patient_id, disease, relative, notes]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Antecedente familiar registrado exitosamente' 
    });
  } catch (error) {
    console.error('Error al registrar antecedente familiar:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
};

// Obtener antecedentes familiares por paciente
exports.getByPatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    const [rows] = await query(
      'SELECT * FROM FamilyHistory WHERE patient_id = ?',
      [patientId]
    );
    res.json({ 
      success: true, 
      familyHistory: rows 
    });
  } catch (error) {
    console.error('Error al obtener antecedentes familiares:', error);
    res.status(500).json({ 
      error: 'Error al obtener los antecedentes familiares' 
    });
  }
};

// Actualizar antecedente familiar
exports.updateFamilyHistory = async (req, res) => {
  try {
    const familyHistoryId = req.params.id;
    const { disease, relative, notes } = req.body;

    const [result] = await query(
      `UPDATE FamilyHistory SET disease = ?, relative = ?, notes = ? WHERE id = ?`,
      [disease, relative, notes, familyHistoryId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Antecedente familiar no encontrado' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Antecedente familiar actualizado exitosamente' 
    });
  } catch (error) {
    console.error('Error al actualizar antecedente familiar:', error);
    res.status(500).json({ 
      error: 'Error al actualizar el antecedente familiar' 
    });
  }
};

// Eliminar antecedente familiar
exports.deleteFamilyHistory = async (req, res) => {
  try {
    const familyHistoryId = req.params.id;

    const [result] = await query(
      'DELETE FROM FamilyHistory WHERE id = ?',
      [familyHistoryId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Antecedente familiar no encontrado' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Antecedente familiar eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error al eliminar antecedente familiar:', error);
    res.status(500).json({ 
      error: 'Error al eliminar el antecedente familiar' 
    });
  }
};