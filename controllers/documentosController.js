const { query } = require('../config/db.sql');

// Subir documento
exports.subirDocumento = async (req, res) => {
  try {
    const { paciente_id, tipo, ruta_archivo, notas, estado } = req.body;

    await query(
      `INSERT INTO Documentos (paciente_id, tipo, ruta_archivo, notas, estado) 
       VALUES (?, ?, ?, ?,?)`,
      [paciente_id, tipo, ruta_archivo, notas, estado]
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
// Obtener un documento específico y marcarlo como leído si estaba pendiente
exports.verDocumentoYMarcarLeido = async (req, res) => {
  try {
    const { id } = req.params;

    const [docs] = await query('SELECT * FROM Documentos WHERE id = ?', [id]);

    if (docs.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    const doc = docs[0];

    // Si el estado es pendiente, actualizarlo a leido
    if (doc.estado === 'pendiente') {
      await query('UPDATE Documentos SET estado = "leido" WHERE id = ?', [id]);
      doc.estado = 'leido'; // actualizar valor en respuesta también
    }

    res.json({ success: true, documento: doc });
  } catch (error) {
    console.error('Error al ver documento:', error);
    res.status(500).json({ error: 'Error al obtener el documento' });
  }
};
