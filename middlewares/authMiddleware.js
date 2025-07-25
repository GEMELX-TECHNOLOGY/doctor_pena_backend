const jwt = require("jsonwebtoken");
const { query } = require("../config/db.sql");

const verificarYRenovarToken = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({ error: "Token no proporcionado o malformado" });
		}

		const token = authHeader.split(" ")[1];
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded;

		// Actualizar last_access en segundo plano
		query("UPDATE Users SET last_access = NOW() WHERE id = ?", [decoded.userId])
			.catch(err => {
				console.error("Error al actualizar last_access:", err);
			});

		// Renovar token
		const nuevoToken = jwt.sign(
			{ userId: decoded.userId, role: decoded.role },
			process.env.JWT_SECRET,
			{ expiresIn: "1h" }
		);

		res.locals.usuario = decoded;
		res.locals.nuevoToken = nuevoToken;
		res.setHeader("x-renewed-token", nuevoToken);

		next();
	} catch (err) {
		console.error("Error al verificar token:", err);
		return res.status(401).json({ error: "Token inválido o expirado" });
	}
};

module.exports = verificarYRenovarToken;
