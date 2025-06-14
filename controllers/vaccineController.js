const { query } = require('../config/db.sql');

// Verificar si el paciente es un bebé o niño
async function isChildPatient(patient_id) {
  const [rows] = await query('SELECT patient_type FROM Patients WHERE id = ?', [patient_id]);
  if (rows.length === 0) return false;
  return ['bebe', 'nino'].includes(rows[0].patient_type);
}

// Registrar una vacuna
exports.registerVaccine = async (req, res) => {
  try {
    const { patient_id, name, application_date, dose, next_dose, notes } = req.body;

    // Validar que el paciente sea un bebé o niño
    if (!(await isChildPatient(patient_id))) {
      return res.status(400).json({ 
        error: 'Las vacunas solo pueden registrarse para pacientes bebés o niños' 
      });
    }

    // Insertar el registro de vacuna
    await query(
      `INSERT INTO Vaccines (patient_id, name, application_date, dose, next_dose, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [patient_id, name, application_date, dose, next_dose, notes]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Vacuna registrada exitosamente' 
    });
  } catch (error) {
    console.error('Error al registrar vacuna:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
};

// Obtener vacunas por paciente
exports.getVaccinesByPatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    const [rows] = await query('SELECT * FROM Vaccines WHERE patient_id = ?', [patientId]);
    res.json({ 
      success: true, 
      vaccines: rows 
    });
  } catch (error) {
    console.error('Error al obtener vacunas del paciente:', error);
    res.status(500).json({ 
      error: 'Error al obtener las vacunas del paciente' 
    });
  }
};

// Actualizar información de vacuna
exports.updateVaccine = async (req, res) => {
  try {
    const vaccineId = req.params.id;
    const { name, application_date, dose, next_dose, notes } = req.body;

    // Actualizar registro de vacuna
    const [result] = await query(
      `UPDATE Vaccines SET name = ?, application_date = ?, dose = ?, next_dose = ?, notes = ?
       WHERE id = ?`,
      [name, application_date, dose, next_dose, notes, vaccineId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Vacuna no encontrada' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Vacuna actualizada exitosamente' 
    });
  } catch (error) {
    console.error('Error al actualizar vacuna:', error);
    res.status(500).json({ 
      error: 'Error al actualizar la vacuna' 
    });
  }
};

// Eliminar registro de vacuna
exports.deleteVaccine = async (req, res) => {
  try {
    const vaccineId = req.params.id;
    const [result] = await query('DELETE FROM Vaccines WHERE id = ?', [vaccineId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Vacuna no encontrada' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Vacuna eliminada exitosamente' 
    });
  } catch (error) {
    console.error('Error al eliminar vacuna:', error);
    res.status(500).json({ 
      error: 'Error al eliminar la vacuna' 
    });
  }
};