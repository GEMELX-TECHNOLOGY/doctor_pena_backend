
const { query } = require('../config/db.sql');

exports.obtenerMedicos = async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM Medicos');
    res.json({ success: true, medicos: rows });
  } catch (err) {
    console.error('Error al obtener médicos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.obtenerMedicoPorId = async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM Medicos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }
    res.json({ success: true, medico: rows[0] });
  } catch (err) {
    console.error('Error al obtener médico:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.actualizarMedico = async (req, res) => {
  try {
    const { nombre, apellido, especialidad, cedula, horario_atencion, consultorio } = req.body;
    const [result] = await query(
      `UPDATE Medicos SET nombre = ?, apellido = ?, especialidad = ?, cedula = ?, horario_atencion = ?, consultorio = ? WHERE id = ?`,
      [nombre, apellido, especialidad, cedula, horario_atencion, consultorio, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }
    res.json({ success: true, mensaje: 'Médico actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar médico:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.eliminarMedico = async (req, res) => {
  try {
    const [result] = await query('DELETE FROM Medicos WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }
    res.json({ success: true, mensaje: 'Médico eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar médico:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
