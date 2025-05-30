const { query } = require('../config/db.sql');


exports.obtenerTodosLosCambios = async (req, res) => {
  try {
    const [rows] = await query(
      `SELECT h.*, 
              m.nombre AS nombre_medico,
              m.apellido AS apellido_medico,
              p.nombre AS nombre_paciente,
              p.apellidos AS apellidos_paciente
       FROM HistorialCambiosPacientes h
       LEFT JOIN Medicos m ON h.modificado_por = m.usuario_id
       INNER JOIN Pacientes p ON h.paciente_id = p.id
       ORDER BY h.fecha_modificacion DESC`
    );

    res.json({ success: true, historial: rows });
  } catch (error) {
    console.error('Error al obtener historial general:', error);
    res.status(500).json({ error: 'Error al obtener historial de cambios' });
  }
};

exports.obtenerHistorialPorPaciente = async (req, res) => {
  try {
    const pacienteId = req.params.id;

    const [pacienteData] = await query(
      `SELECT id, nombre, apellidos, genero, fecha_nacimiento, custom_id
       FROM Pacientes
       WHERE id = ?`,
      [pacienteId]
    );

    if (pacienteData.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const paciente = pacienteData[0];

    const [historial] = await query(
      `SELECT h.*, 
              m.nombre AS nombre_medico,
              m.apellido AS apellido_medico
       FROM HistorialCambiosPacientes h
       LEFT JOIN Medicos m ON h.modificado_por = m.usuario_id
       WHERE h.paciente_id = ?
       ORDER BY h.fecha_modificacion DESC`,
      [pacienteId]
    );

    res.json({
      success: true,
      paciente,
      historial
    });

  } catch (error) {
    console.error('Error al obtener historial del paciente:', error);
    res.status(500).json({ error: 'Error al obtener historial del paciente' });
  }
};
