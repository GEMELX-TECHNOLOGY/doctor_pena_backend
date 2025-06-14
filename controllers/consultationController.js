const { query } = require('../config/db.sql');

// Crear una nueva consulta médica
exports.createConsultation = async (req, res) => {
  try {
    const { patient_id, date, symptoms, diagnosis, treatment, private_notes, paid = 0 } = req.body;

    // Verificar que el paciente exista
    const [patientRes] = await query('SELECT id FROM Patients WHERE id = ?', [patient_id]);
    if (patientRes.length === 0) {
      return res.status(400).json({ error: 'Paciente no encontrado' });
    }

    // Insertar la nueva consulta en la base de datos
    await query(
      `INSERT INTO Consultations (patient_id, date, symptoms, diagnosis, treatment, private_notes, paid)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, date, symptoms, diagnosis, treatment, private_notes, paid]
    );

    res.status(201).json({ success: true, message: 'Consulta registrada exitosamente' });
  } catch (error) {
    console.error('Error al registrar consulta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener todas las consultas médicas
exports.getAllConsultations = async (req, res) => {
  try {
    const [rows] = await query(`
      SELECT 
        c.*, 
        p.registration_number,
        p.first_name AS paciente_nombre, 
        p.last_name AS paciente_apellido, 
        TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) AS paciente_edad
      FROM Consultations c
      JOIN Patients p ON c.patient_id = p.id
      ORDER BY c.date DESC
    `);

    res.json({ success: true, consultations: rows });
  } catch (err) {
    console.error('Error al obtener consultas:', err);
    res.status(500).json({ error: 'Error al obtener las consultas' });
  }
};


// Obtener una consulta médica por ID
exports.getConsultationById = async (req, res) => {
  try {
    const [rows] = await query(`
      SELECT 
        c.*, 
        p.registration_number,
        p.first_name AS paciente_nombre, 
        p.last_name AS paciente_apellido, 
        TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) AS paciente_edad
      FROM Consultations c
      JOIN Patients p ON c.patient_id = p.id
      WHERE c.id = ?
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ error: 'Consulta no encontrada' });
    res.json({ success: true, consultation: rows[0] });
  } catch (err) {
    console.error('Error al obtener consulta:', err);
    res.status(500).json({ error: 'Error al obtener la consulta' });
  }
};


// Actualizar una consulta médica existente
exports.updateConsultation = async (req, res) => {
  try {
    const { date, symptoms, diagnosis, treatment, private_notes, paid } = req.body;
    const [result] = await query(
      `UPDATE Consultations 
       SET date = ?, symptoms = ?, diagnosis = ?, treatment = ?, private_notes = ?, paid = ?
       WHERE id = ?`,
      [date, symptoms, diagnosis, treatment, private_notes, paid, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Consulta no encontrada' });
    res.json({ success: true, message: 'Consulta actualizada exitosamente' });
  } catch (err) {
    console.error('Error al actualizar consulta:', err);
    res.status(500).json({ error: 'Error al actualizar la consulta' });
  }
};

// Eliminar una consulta médica
exports.deleteConsultation = async (req, res) => {
  try {
    const [result] = await query('DELETE FROM Consultations WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Consulta no encontrada' });
    res.json({ success: true, message: 'Consulta eliminada exitosamente' });
  } catch (err) {
    console.error('Error al eliminar consulta:', err);
    res.status(500).json({ error: 'Error al eliminar la consulta' });
  }
};

// Obtener consultas por paciente
exports.getConsultationsByPatient = async (req, res) => {
  try {
    const patientId = req.params.id;

    const [rows] = await query(`
      SELECT 
        c.id, c.date, c.symptoms, c.diagnosis, c.treatment, c.paid,
        p.registration_number,
        p.first_name AS paciente_nombre, 
        p.last_name AS paciente_apellido, 
        TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) AS paciente_edad
      FROM Consultations c
      JOIN Patients p ON c.patient_id = p.id
      WHERE c.patient_id = ?
      ORDER BY c.date DESC
    `, [patientId]);

    res.json({ success: true, consultations: rows });
  } catch (err) {
    console.error('Error al obtener consultas del paciente:', err);
    res.status(500).json({ error: 'Error al obtener las consultas del paciente' });
  }
};


// Marcar consulta como pagada
exports.markAsPaid = async (req, res) => {
  try {
    const consultationId = req.params.id;

    const [result] = await query(
      `UPDATE Consultations SET paid = 1 WHERE id = ?`,
      [consultationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }

    res.json({ success: true, message: 'Consulta marcada como pagada' });
  } catch (err) {
    console.error('Error al marcar consulta como pagada:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};