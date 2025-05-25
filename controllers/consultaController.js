
const { query } = require('../config/db.sql');

// Validar existencia de paciente y médico
async function existePaciente(paciente_id) {
  const [res] = await query('SELECT id FROM Pacientes WHERE id = ?', [paciente_id]);
  return res.length > 0;
}

async function existeMedico(medico_id) {
  const [res] = await query('SELECT id FROM Medicos WHERE id = ?', [medico_id]);
  return res.length > 0;
}

exports.crearConsulta = async (req, res) => {
  try {
    const { paciente_id, medico_id, fecha, sintomas, diagnostico, tratamiento, notas_privadas } = req.body;

    if (!(await existePaciente(paciente_id))) {
      return res.status(400).json({ error: 'Paciente no encontrado' });
    }

    if (!(await existeMedico(medico_id))) {
      return res.status(400).json({ error: 'Médico no encontrado' });
    }

    await query(
      `INSERT INTO Consultas (paciente_id, médico_id, fecha, síntomas, diagnóstico, tratamiento, notas_privadas)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [paciente_id, medico_id, fecha, sintomas, diagnostico, tratamiento, notas_privadas]
    );

    res.status(201).json({ success: true, mensaje: 'Consulta registrada correctamente' });
  } catch (error) {
    console.error('Error al registrar consulta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.obtenerConsultas = async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM Consultas ORDER BY fecha DESC');
    res.json({ success: true, consultas: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener consultas' });
  }
};

exports.obtenerConsultaPorId = async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM Consultas WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Consulta no encontrada' });
    res.json({ success: true, consulta: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener consulta' });
  }
};

exports.actualizarConsulta = async (req, res) => {
  try {
    const { fecha, sintomas, diagnostico, tratamiento, notas_privadas } = req.body;
    const [result] = await query(
      `UPDATE Consultas SET fecha = ?, síntomas = ?, diagnóstico = ?, tratamiento = ?, notas_privadas = ? WHERE id = ?`,
      [fecha, sintomas, diagnostico, tratamiento, notas_privadas, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Consulta no encontrada' });
    res.json({ success: true, mensaje: 'Consulta actualizada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar consulta' });
  }
};

exports.eliminarConsulta = async (req, res) => {
  try {
    const [result] = await query('DELETE FROM Consultas WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Consulta no encontrada' });
    res.json({ success: true, mensaje: 'Consulta eliminada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar consulta' });
  }
};

exports.consultasPorPaciente = async (req, res) => {
  try {
    const pacienteId = req.params.id;
    const [rows] = await query(
      `SELECT id, fecha, síntomas, diagnóstico, tratamiento
       FROM Consultas
       WHERE paciente_id = ?
       ORDER BY fecha DESC`,
      [pacienteId]
    );
    res.json({ success: true, consultas: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener consultas del paciente' });
  }
};
