
const { query } = require('../config/db.sql');



exports.crearConsulta = async (req, res) => {
  try {
    const { paciente_id, fecha, sintomas, diagnostico, tratamiento, notas_privadas, pagado = 0 } = req.body;

    const [resPaciente] = await query('SELECT id FROM Pacientes WHERE id = ?', [paciente_id]);
    if (resPaciente.length === 0) {
      return res.status(400).json({ error: 'Paciente no encontrado' });
    }

    await query(
      `INSERT INTO Consultas (paciente_id, fecha, síntomas, diagnóstico, tratamiento, notas_privadas, pagado)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [paciente_id, fecha, sintomas, diagnostico, tratamiento, notas_privadas, pagado]
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
    const { fecha, sintomas, diagnostico, tratamiento, notas_privadas,pagado } = req.body;
    const [result] = await query(
     `UPDATE Consultas 
     SET fecha = ?, síntomas = ?, diagnóstico = ?, tratamiento = ?, notas_privadas = ?, pagado = ?
     WHERE id = ?`,
     [fecha, sintomas, diagnostico, tratamiento, notas_privadas, pagado, req.params.id]
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
exports.marcarComoPagada = async (req, res) => {
  try {
    const consultaId = req.params.id;

    const [result] = await query(
      `UPDATE Consultas SET pagado = 1 WHERE id = ?`,
      [consultaId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }

    res.json({ success: true, mensaje: 'Consulta marcada como pagada' });
  } catch (err) {
    console.error('Error al marcar consulta como pagada:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

