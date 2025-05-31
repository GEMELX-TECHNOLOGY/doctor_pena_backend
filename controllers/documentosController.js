const { query } = require('../config/db.sql');

// Subir documento
exports.subirDocumento = async (req, res) => {
  try {
    const { paciente_id, tipo, ruta_archivo, notas } = req.body;

    await query(
      `INSERT INTO Documentos (paciente_id, tipo, ruta_archivo, notas) 
       VALUES (?, ?, ?, ?)`,
      [paciente_id, tipo, ruta_archivo, notas]
    );

    res.status(201).json({ success: true, mensaje: 'Documento subido correctamente' });
  } catch (error) {
    console.error('Error al subir documento:', error);
    res.status(500).json({ error: 'Error al subir documento' });
  }
};

// Obtener documentos por paciente
exports.obtenerPorPaciente = async (req, res) => {
  try {
    const pacienteId = req.params.id;

    const [docs] = await query(
      `SELECT * FROM Documentos 
       WHERE paciente_id = ? 
       ORDER BY fecha DESC`,
      [pacienteId]
    );

    res.json({ success: true, documentos: docs });
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    res.status(500).json({ error: 'Error al obtener documentos' });
  }
};

// Eliminar documento
exports.eliminarDocumento = async (req, res) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM Documentos WHERE id = ?', [id]);

    res.json({ success: true, mensaje: 'Documento eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    res.status(500).json({ error: 'Error al eliminar documento' });
  }
};
