const { query } = require('../config/db.sql');

// Middleware interno para verificar si el usuario es admin
function esAdmin(req, res) {
  if (req.user?.rol !== 'admin') {
    res.status(403).json({ error: 'Acceso restringido al administrador' });
    return false;
  }
  return true;
}

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
    if (rows.length === 0) return res.status(404).json({ error: 'Médico no encontrado' });
    res.json({ success: true, medico: rows[0] });
  } catch (err) {
    console.error('Error al obtener médico:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.crearMedico = async (req, res) => {
  if (!esAdmin(req, res)) return;

  try {
    const { nombre, apellido, especialidad, cedula, horario_atencion, consultorio, usuario_id } = req.body;

    await query(
      `INSERT INTO Medicos (usuario_id, nombre, apellido, especialidad, cedula, horario_atencion, consultorio)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, nombre, apellido, especialidad, cedula, horario_atencion, consultorio]
    );

    res.status(201).json({ success: true, mensaje: 'Médico registrado correctamente' });
  } catch (err) {
    console.error('Error al registrar médico:', err);
    res.status(500).json({ error: 'Error al registrar médico' });
  }
};

exports.actualizarMedico = async (req, res) => {
  if (!esAdmin(req, res)) return;

  try {
    const { nombre, apellido, especialidad, cedula, horario_atencion, consultorio } = req.body;
    const [result] = await query(
      `UPDATE Medicos SET nombre = ?, apellido = ?, especialidad = ?, cedula = ?, horario_atencion = ?, consultorio = ? WHERE id = ?`,
      [nombre, apellido, especialidad, cedula, horario_atencion, consultorio, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Médico no encontrado' });

    res.json({ success: true, mensaje: 'Médico actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar médico:', err);
    res.status(500).json({ error: 'Error al actualizar médico' });
  }
};

exports.eliminarMedico = async (req, res) => {
  if (!esAdmin(req, res)) return;

  try {
    const [result] = await query('DELETE FROM Medicos WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Médico no encontrado' });

    res.json({ success: true, mensaje: 'Médico eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar médico:', err);
    res.status(500).json({ error: 'Error al eliminar médico' });
  }
};
