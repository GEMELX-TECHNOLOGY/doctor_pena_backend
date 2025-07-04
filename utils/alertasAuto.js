const { query } = require("../config/db.sql");

exports.generateAutomaticAlerts = async () => {
	try {
		const doctorId = 1;
		// STOCK bajo
		const [productosBajos] = await query(
			`SELECT * FROM Products WHERE stock <= minimum_stock`,
		);
		for (const prod of productosBajos) {
			await query(
				`INSERT INTO Alerts (type, recipient_id, message, date, \`read\`)
         SELECT 'stock', ?, ?, NOW(), 0 FROM DUAL
         WHERE NOT EXISTS (
           SELECT 1 FROM Alerts 
           WHERE type = 'stock' AND message LIKE ? AND \`read\` = 0
         )`,
				[
					doctorId,
					`The product "${prod.name}" has low stock (${prod.stock}).`,
					`%${prod.name}%`,
				],
			);
		}

		// CADUCIDAD próxima
		const [productosCaducos] = await query(
			`SELECT * FROM Products WHERE expiration IS NOT NULL AND expiration <= DATE_ADD(NOW(), INTERVAL 7 DAY)`,
		);
		for (const prod of productosCaducos) {
			await query(
				`INSERT INTO Alerts (type, recipient_id, message, date, \`read\`)
         SELECT 'caducidad', ?, ?, NOW(), 0 FROM DUAL
         WHERE NOT EXISTS (
           SELECT 1 FROM Alerts 
           WHERE type = 'caducidad' AND message LIKE ? AND \`read\` = 0
         )`,
				[
					doctorId,
					`The product "${prod.name}" expires soon (${prod.expiration})`,
					`%${prod.name}%`,
				],
			);
		}

		console.log("Automatic alerts generated");
	} catch (err) {
		console.error("Error generating automatic alerts:", err);
	}
};
