const mysql = require("mysql2/promise");

const pool = mysql.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

// Establecer zona horaria UTC-5 para cada nueva conexión
pool.on("connection", (connection) => {
	connection
		.promise()
		.query("SET time_zone = '-05:00'")
		.then(() => {
			console.log("🕒 Zona horaria -05:00 establecida");
		})
		.catch((err) => {
			console.error("❌ Error al establecer la zona horaria:", err.message);
		});
});

async function getConnection() {
	return await pool.getConnection();
}

async function connectMySQL() {
	try {
		const connection = await pool.getConnection();
		console.log("✅ Conectado a MySQL");
		connection.release();
	} catch (error) {
		console.error("Error al conectar a MySQL:", error);
		throw error;
	}
}

module.exports = {
	query: pool.query.bind(pool),
	getConnection,
	connectMySQL,
};
