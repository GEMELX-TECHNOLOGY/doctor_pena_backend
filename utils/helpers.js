const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const { query } = require("../config/db.sql");

//  Generar token aleatorio de recuperación
exports.generateRecoveryToken = () => {
	return crypto.randomBytes(20).toString("hex");
};

//  Generar token JWT con expiración
exports.generarTokenJWT = (payload, secret, expiresIn) => {
	return jwt.sign(payload, secret, { expiresIn });
};

// Generar un ID personalizado y único tipo PAC12345
exports.generateCustomId = async () => {
	let customId = "";
	let existe = true;

	do {
		const numero = Math.floor(10000 + Math.random() * 90000); // genera del 10000 al 99999
		customId = `PAC${numero}`;

		// Validamos contra el campo registration_number en la tabla correcta: Patients
		const [rows] = await query(
			"SELECT id FROM Patients WHERE registration_number = ?",
			[customId],
		);

		existe = rows.length > 0;
	} while (existe);

	return customId;
};

// Calcular edad desde una fecha de nacimiento
exports.calculateAge = (fechaNacimiento) => {
	const hoy = new Date();
	const nacimiento = new Date(fechaNacimiento);
	let edad = hoy.getFullYear() - nacimiento.getFullYear();
	const mes = hoy.getMonth() - nacimiento.getMonth();
	if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
	return edad;
};

// Detectar cambios entre los datos originales y los nuevos
exports.detectPatientChanges = (original, updated) => {
	const changes = [];

	for (const key in updated) {
		const newValue = updated[key];
		const oldValue = original[key];

		if (
			newValue !== undefined &&
			newValue !== null &&
			String(newValue) !== String(oldValue)
		) {
			changes.push({
				field: key,
				old: oldValue,
				new: newValue,
			});
		}
	}

	return changes;
};
