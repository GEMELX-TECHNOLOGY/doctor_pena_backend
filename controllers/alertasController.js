const { query } = require('../config/db.sql');

// Crear alerta
exports.crearAlerta = async (req, res) => {
  try {
    const { tipo, destinatario_id, mensaje } = req.body;

    await query(
      `INSERT INTO Alertas (tipo, destinatario_id, mensaje) 
       VALUES (?, ?, ?)`,
      [tipo, destinatario_id, mensaje]
    );

    res.status(201).json({ success: true, mensaje: 'Alerta creada correctamente' });
  } catch (error) {
    console.error('Error al crear alerta:', error);
    res.status(500).json({ error: 'Error al crear alerta' });
  }
};

// Obtener alertas por destinatario
exports.obtenerPorDestinatario = async (req, res) => {
  try {
    const { destinatario_id } = req.params;

    const [alertas] = await query(
      `SELECT * FROM Alertas 
       WHERE destinatario_id = ?
       ORDER BY fecha DESC`,
      [destinatario_id]
    );

    res.json({ success: true, alertas });
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    res.status(500).json({ error: 'Error al obtener alertas' });
  }
};

// Marcar como leída
exports.marcarComoLeida = async (req, res) => {
  try {
    const { id } = req.params;

    await query(`UPDATE Alertas SET leída = 1 WHERE id = ?`, [id]);

    res.json({ success: true, mensaje: 'Alerta marcada como leída' });
  } catch (error) {
    console.error('Error al marcar alerta como leída:', error);
    res.status(500).json({ error: 'Error al marcar alerta como leída' });
  }
};
