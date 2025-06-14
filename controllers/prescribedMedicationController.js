const { query } = require('../config/db.sql');

// Agregar un medicamento prescrito
exports.addPrescribedMedication = async (req, res) => {
  try {
    const { prescription_id, medication_id, dose, frequency, duration } = req.body;

    await query(
      `INSERT INTO PrescribedMedications (prescription_id, medication_id, dose, frequency, duration)
       VALUES (?, ?, ?, ?, ?)`,
      [prescription_id, medication_id, dose, frequency, duration]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Medicamento prescrito agregado correctamente' 
    });
  } catch (error) {
    console.error('Error al agregar medicamento prescrito:', error);
    res.status(500).json({ 
      error: 'Error al agregar el medicamento prescrito' 
    });
  }
};

// Obtener medicamentos por prescripción
exports.getByPrescription = async (req, res) => {
  try {
    const prescriptionId = req.params.id;

    const [rows] = await query(
      `SELECT mr.*, p.name AS medication_name, p.formula_salt
       FROM PrescribedMedications mr
       INNER JOIN Products p ON mr.medication_id = p.id
       WHERE mr.prescription_id = ?`,
      [prescriptionId]
    );

    res.json({ 
      success: true, 
      medications: rows 
    });
  } catch (error) {
    console.error('Error al obtener medicamentos prescritos:', error);
    res.status(500).json({ 
      error: 'Error al obtener los medicamentos prescritos' 
    });
  }
};

// Actualizar un medicamento prescrito
exports.updatePrescribedMedication = async (req, res) => {
  try {
    const { id } = req.params;
    const { dose, frequency, duration } = req.body;

    await query(
      `UPDATE PrescribedMedications 
       SET dose = ?, frequency = ?, duration = ? 
       WHERE id = ?`,
      [dose, frequency, duration, id]
    );

    res.json({ 
      success: true, 
      message: 'Medicamento prescrito actualizado correctamente' 
    });
  } catch (error) {
    console.error('Error al actualizar medicamento prescrito:', error);
    res.status(500).json({ 
      error: 'Error al actualizar el medicamento prescrito' 
    });
  }
};

// Eliminar un medicamento prescrito
exports.deletePrescribedMedication = async (req, res) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM PrescribedMedications WHERE id = ?', [id]);

    res.json({ 
      success: true, 
      message: 'Medicamento prescrito eliminado correctamente' 
    });
  } catch (error) {
    console.error('Error al eliminar medicamento prescrito:', error);
    res.status(500).json({ 
      error: 'Error al eliminar el medicamento prescrito' 
    });
  }
};