const { query } = require("../config/db.sql");

// Crear alerta
exports.createAlert = async (req, res) => {
	try {
		const { type, recipient_id, message } = req.body;

		await query(
			`INSERT INTO Alerts (type, recipient_id, message) 
       VALUES (?, ?, ?)`,
			[type, recipient_id, message],
		);

		res
			.status(201)
			.json({ success: true, message: "Alerta creada correctamente" });
	} catch (error) {
		console.error("Error creating alert:", error);
		res.status(500).json({ error: "Error al crear alerta" });
	}
};
// Obtener alertas por destinatario
exports.getByRecipient = async (req, res) => {
	try {
		const { recipient_id } = req.params;
		const [alerts] = await query(
			`SELECT * FROM Alerts 
       WHERE recipient_id = ?
       ORDER BY date DESC`,
			[recipient_id],
		);
		res.json({ success: true, alerts });
	} catch (error) {
		console.error("Error al obtener alertas:", error);
		res.status(500).json({ error: "Error al obtener alertas" });
	}
};

// Marcar como leída
exports.markAsRead = async (req, res) => {
	try {
		const { id } = req.params;
		await query(`UPDATE Alerts SET read = 1 WHERE id = ?`, [id]);
		res.json({ success: true, message: "Alerta marcada como leída" });
	} catch (error) {
		console.error("Error al marcar alerta como leída", error);
		res.status(500).json({ error: "Error al marcar alerta como leída" });
	}
};
