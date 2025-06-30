const { query } = require('../config/db.sql');

// Subir un nuevo documento
exports.uploadDocument = async (req, res) => {
  try {
    const { patient_id, title, description, type, file_path, notes, status } = req.body;

    await query(
      `INSERT INTO Documents (patient_id, title, description, type, file_path, notes, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, title, description, type, file_path, notes, status]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Documento subido exitosamente' 
    });
  } catch (error) {
    console.error('Error al subir documento:', error);
    res.status(500).json({ 
      error: 'Error al subir el documento' 
    });
  }
};


// Obtener documentos por paciente
exports.getByPatient = async (req, res) => {
  try {
    const patientId = req.params.id;

    const [docs] = await query(
      `SELECT * FROM Documents 
       WHERE patient_id = ? 
       ORDER BY date DESC`,
      [patientId]
    );

    res.json({ 
      success: true, 
      documents: docs 
    });
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    res.status(500).json({ 
      error: 'Error al obtener los documentos' 
    });
  }
};

// Eliminar un documento
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM Documents WHERE id = ?', [id]);

    res.json({ 
      success: true, 
      message: 'Documento eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    res.status(500).json({ 
      error: 'Error al eliminar el documento' 
    });
  }
};

// Ver documento y marcarlo como leído
exports.viewAndMarkAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const [docs] = await query('SELECT * FROM Documents WHERE id = ?', [id]);

    if (docs.length === 0) {
      return res.status(404).json({ 
        error: 'Documento no encontrado' 
      });
    }

    const doc = docs[0];

    if (doc.status === 'pendiente') {
      await query('UPDATE Documents SET status = "leido" WHERE id = ?', [id]);
      doc.status = 'leido';
    }

    res.json({ 
      success: true, 
      document: doc 
    });
  } catch (error) {
    console.error('Error al visualizar documento:', error);
    res.status(500).json({ 
      error: 'Error al obtener el documento' 
    });
  }
};
exports.getReadDocuments = async (req, res) => {
  try {
    const patientId = req.params.id;

    const [docs] = await query(
      `SELECT * FROM Documents 
       WHERE patient_id = ? AND status = 'leido' 
       ORDER BY date DESC`,
      [patientId]
    );

    res.json({ 
      success: true, 
      documents: docs 
    });
  } catch (error) {
    console.error('Error al obtener documentos leídos:', error);
    res.status(500).json({ 
      error: 'Error al obtener los documentos leídos' 
    });
  }
};
exports.getPendingDocuments = async (req, res) => {
  try {
    const patientId = req.params.id;

    const [docs] = await query(
      `SELECT * FROM Documents 
       WHERE patient_id = ? AND status = 'pendiente' 
       ORDER BY date DESC`,
      [patientId]
    );

    res.json({ 
      success: true, 
      documents: docs 
    });
  } catch (error) {
    console.error('Error al obtener documentos pendientes:', error);
    res.status(500).json({ 
      error: 'Error al obtener los documentos pendientes' 
    });
  }
};
exports.getAllReadDocuments = async (req, res) => {
  try {
    const [docs] = await query(`
      SELECT D.*, Pa.first_name, Pa.last_name 
      FROM Documents D
      JOIN Patients Pa ON D.patient_id = Pa.id
      WHERE D.status = 'leido'
      ORDER BY D.date DESC
    `);

    res.json({ 
      success: true, 
      documents: docs 
    });
  } catch (error) {
    console.error('Error al obtener documentos leídos (global):', error);
    res.status(500).json({ 
      error: 'Error al obtener los documentos leídos' 
    });
  }
};
//exports.getAllPendingDocuments = async (req, res) => {
  

