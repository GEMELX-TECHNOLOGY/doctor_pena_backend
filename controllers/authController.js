require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { query } = require("../config/db.sql");
const { generateRecoveryToken } = require("../utils/helpers");
const { generateCustomId } = require("../utils/helpers");
const { sendPasswordResetEmail } = require("../services/emailService");
const { calculateAge } = require("../utils/helpers");
// Roles permitidos para web y app
const webRoles = ["medico", "admin"];
const appRoles = ["paciente", "medico", "admin"];

// Función común para registrar usuarios con roles permitidos según contexto
async function registerUser(req, res, allowedRoles) {
	try {
		const { email, password, role, phone } = req.body;

		if (!allowedRoles.includes(role)) {
			return res.status(400).json({
				error: "Rol no permitido para este tipo de registro",
			});
		}

		const [existingUsers] = await query("SELECT * FROM Users WHERE email = ?", [
			email,
		]);
		if (existingUsers.length > 0) {
			return res
				.status(409)
				.json({ error: "El correo electrónico ya está registrado" });
		}

		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		const [result] = await query(
			`INSERT INTO Users 
            (role, email, phone, password_hash, status) 
            VALUES (?, ?, ?, ?, 'activo')`,
			[role, email, phone, hashedPassword],
		);

		const insertId = result.insertId;

		if (role === "paciente") {
			const {
				first_name,
				last_name,
				gender,
				birth_date,
				blood_type,
				allergies,
				chronic_diseases,
				average_height,
				average_weight,
			} = req.body;

			await query(
				`INSERT INTO Patients 
                (user_id, first_name, last_name, gender, birth_date, blood_type, allergies, chronic_diseases, average_height, average_weight) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					insertId,
					first_name,
					last_name,
					gender,
					birth_date,
					blood_type,
					allergies,
					chronic_diseases,
					average_height,
					average_weight,
				],
			);
		}

		if (role === "medico") {
			const {
				first_name,
				last_name,
				specialty,
				license_number,
				schedule,
				office,
			} = req.body;

			if (
				!first_name ||
				!last_name ||
				!specialty ||
				!license_number ||
				!schedule ||
				!office
			) {
				return res.status(400).json({
					error: "Faltan campos obligatorios para registrar un médico",
				});
			}

			await query(
				`INSERT INTO Doctors 
                (user_id, first_name, last_name, specialty, license_number, schedule, office) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
				[
					insertId,
					first_name,
					last_name,
					specialty,
					license_number,
					schedule,
					office,
				],
			);
		}

		const token = jwt.sign({ userId: insertId, role }, process.env.JWT_SECRET, {
			expiresIn: "1h",
		});

		res.status(201).json({
			success: true,
			userId: insertId,
			token,
		});
	} catch (error) {
		console.error("Error en registro:", error);
		if (error.code === "ER_DUP_ENTRY") {
			return res.status(409).json({
				error: "El correo electrónico ya está registrado",
			});
		}
		res.status(500).json({
			error: "Error interno del servidor al registrar usuario",
			detail: error.message,
		});
	}
}

// Exportar funciones específicas para cada tipo de registro
exports.registerWeb = (req, res) => registerUser(req, res, webRoles);
exports.registerApp = (req, res) => registerUser(req, res, appRoles);



exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;

		const [users] = await query("SELECT * FROM Users WHERE email = ?", [email]);
		const user = users[0];

		if (!user) {
			return res.status(401).json({ error: "Correo o contraseña incorrectos" });
		}

		const passwordMatch = await bcrypt.compare(password, user.password_hash);
		if (!passwordMatch) {
			return res.status(401).json({ error: "Correo o contraseña incorrectos" });
		}

		await query("UPDATE Users SET last_access = NOW() WHERE id = ?", [user.id]);

		const payload = { userId: user.id, role: user.role };

		// Generar registration_number si aplica
		if (user.role === "paciente") {
			const [patients] = await query(
				"SELECT registration_number FROM Patients WHERE user_id = ?",
				[user.id]
			);
			if (patients.length && patients[0].registration_number) {
				payload.registration_number = patients[0].registration_number;
			} else {
				const newRegNumber = await generateCustomId();
				await query(
					"UPDATE Patients SET registration_number = ? WHERE user_id = ?",
					[newRegNumber, user.id]
				);
				payload.registration_number = newRegNumber;
			}
		}

		const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
			expiresIn: "15m",
		});

		const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
			expiresIn: "7d",
		});

		await query("INSERT INTO RefreshTokens (user_id, token) VALUES (?, ?)", [
			user.id,
			refreshToken,
		]);

		res.json({
			access_token: accessToken,
			refresh_token: refreshToken,
			...(user.role === "paciente" ? { registration_number: payload.registration_number } : {}),
		});
	} catch (error) {
		console.error("Error en login:", error);
		res.status(500).json({ error: "Error interno del servidor", detail: error.message });
	}
};


// Función para solicitar recuperación de contraseña
// forgotPassword
exports.forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;
		const [users] = await query("SELECT * FROM Users WHERE email = ?", [email]);
		const user = users[0];
		if (!user) {
			return res
				.status(404)
				.json({ error: "No existe un usuario con ese correo electrónico" });
		}

		const resetToken = generateRecoveryToken();
		//  fecha en formato MySQL UTC
		const expiration = new Date(Date.now() + 3600000)
			.toISOString()
			.slice(0, 19)
			.replace("T", " ");

		await query(
			`UPDATE Users SET reset_token = ?, reset_token_expires_at = ? WHERE id = ?`,
			[resetToken, expiration, user.id],
		);

		const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
		await sendPasswordResetEmail(email, resetLink);

		res.json({
			success: true,
			message:
				"Se ha enviado un enlace para restablecer la contraseña a tu correo electrónico",
		});
	} catch (error) {
		console.error("Error en recuperación de contraseña:", error);
		res.status(500).json({
			error: "Error al procesar la solicitud de recuperación de contraseña",
			detail:
				process.env.NODE_ENV === "development" ? error.message : undefined,
		});
	}
};

// resetPassword
exports.resetPassword = async (req, res) => {
	try {
		const { token, newPassword } = req.body;
		if (!token || !newPassword) {
			return res
				.status(400)
				.json({ error: "Se requiere el token y la nueva contraseña" });
		}

		const [users] = await query(
			`SELECT * FROM Users WHERE reset_token = ? AND reset_token_expires_at > UTC_TIMESTAMP()`,
			[token],
		);

		const user = users[0];
		if (!user) {
			return res.status(400).json({ error: "Token inválido o expirado" });
		}

		const hashedPassword = await bcrypt.hash(newPassword, 10);

		const result = await query(
			`UPDATE Users SET password_hash = ?, reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?`,
			[hashedPassword, user.id],
		);

		if (result.affectedRows === 0) {
			return res
				.status(500)
				.json({ error: "No se pudo actualizar la contraseña" });
		}

		res.json({ success: true, message: "Contraseña actualizada exitosamente" });
	} catch (error) {
		console.error("Error al restablecer contraseña:", error);
		res.status(500).json({ error: "Error al restablecer la contraseña" });
	}
};

// Función para renovar token JWT
exports.refreshToken = async (req, res) => {
	try {
		const oldToken = req.query.token;

		if (!oldToken) {
			return res.status(401).json({ error: "No se proporcionó el token" });
		}

		const decoded = jwt.verify(oldToken, process.env.JWT_SECRET, {
			ignoreExpiration: true,
		});

		// Verifica si el token existe en la base (buena práctica)
		const [validTokens] = await query(
			"SELECT * FROM RefreshTokens WHERE token = ?",
			[oldToken]
		);
		if (validTokens.length === 0) {
			return res
				.status(401)
				.json({ error: "Token no registrado o ya revocado" });
		}

		await query("UPDATE Users SET last_access = NOW() WHERE id = ?", [
			decoded.userId,
		]);

		const payload = { userId: decoded.userId, role: decoded.role };
		const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, {
			expiresIn: "15m",
		});

		res.json({
			success: true,
			access_token: newAccessToken,
		});
	} catch (error) {
		console.error("Error al renovar token:", error);
		res.status(401).json({ error: "Token inválido o expirado" });
	}
};



// Función para actualizar credenciales de administrador
exports.updateAdminCredentials = async (req, res) => {
	try {
		const adminId = req.user?.userId;
		const { email, newPassword } = req.body;

		if (req.user?.role !== "admin") {
			return res.status(403).json({
				error: "Solo los administradores pueden actualizar sus credenciales",
			});
		}

		const updates = [];
		const values = [];

		// Solo se actualiza el email si es una cadena no vacía
		if (typeof email === "string" && email.trim() !== "") {
			const normalizedEmail = email.trim().toLowerCase();
			updates.push("email = ?");
			values.push(normalizedEmail);
		}

		// Solo se actualiza la contraseña si es una cadena no vacía
		if (typeof newPassword === "string" && newPassword.trim() !== "") {
			const hashed = await bcrypt.hash(newPassword, 10);
			updates.push("password_hash = ?");
			values.push(hashed);
		}

		if (updates.length === 0) {
			return res.status(400).json({ error: "No hay datos para actualizar" });
		}

		values.push(adminId);

		await query(`UPDATE Users SET ${updates.join(", ")} WHERE id = ?`, values);

		res.json({
			success: true,
			message: "Credenciales actualizadas correctamente",
		});
	} catch (err) {
		console.error("Error al actualizar credenciales de administrador:", err);
		res
			.status(500)
			.json({ error: "Error interno al actualizar las credenciales" });
	}
};

// Función para registrar paciente desde la app
exports.registerPatientApp = async (req, res) => {
	try {
		const { email, password, phone, registration_number } = req.body;

		// Validar campos obligatorios
		if (!email || !password || !phone || !registration_number) {
			return res.status(400).json({ error: "Faltan campos obligatorios" });
		}

		// Verificar que la matrícula exista en Patients
		const [patientRows] = await query(
			"SELECT * FROM Patients WHERE registration_number = ?",
			[registration_number],
		);
		if (patientRows.length === 0) {
			return res
				.status(404)
				.json({ error: "Matrícula no encontrada en el sistema" });
		}

		const patient = patientRows[0];

		// Verificar si la matrícula ya está asociada a un usuario
		if (patient.user_id) {
			return res
				.status(400)
				.json({ error: "Esta matrícula ya está asociada a un usuario" });
		}

		// Verificar si el correo ya está registrado
		const [existingUsers] = await query("SELECT * FROM Users WHERE email = ?", [
			email,
		]);
		if (existingUsers.length > 0) {
			return res
				.status(409)
				.json({ error: "El correo electrónico ya está registrado" });
		}

		// Hashear la contraseña
		const hashedPassword = await bcrypt.hash(password, 10);

		// Obtener URL de la foto de perfil subida
		const profilePictureUrl = req.file?.path || null;

		// Insertar nuevo usuario con rol 'paciente'
		const [userResult] = await query(
			`
      INSERT INTO Users (role, email, phone, password_hash, status, profile_picture)
      VALUES (?, ?, ?, ?, 'activo', ?)
    `,
			["paciente", email, phone, hashedPassword, profilePictureUrl],
		);

		const newUserId = userResult.insertId;

		// Actualizar paciente para asociar con nuevo usuario
		await query("UPDATE Patients SET user_id = ? WHERE id = ?", [
			newUserId,
			patient.id,
		]);

		// Generar token JWT
		const token = jwt.sign(
			{ userId: newUserId, role: "paciente" },
			process.env.JWT_SECRET,
			{ expiresIn: "1h" },
		);

		// Responder  y datos útiles
		res.status(201).json({
			success: true,
			message: "Registro completado exitosamente",
			user_id: newUserId,
			patient_id: patient.id,
			token,
			profile_picture: profilePictureUrl,
		});
	} catch (error) {
		console.error("Error en registro de paciente:", error);
		res.status(500).json({
			error: "Error interno del servidor durante el registro",
			detail: error.message,
		});
	}
};

// Función para actualizar credenciales de paciente
exports.updatePatientCredentials = async (req, res) => {
	try {
		const patientId = req.user?.userId;
		const { email, nuevaContrasena } = req.body;

		if (req.user?.role !== "paciente") {
			return res.status(403).json({
				error: "Solo los pacientes pueden actualizar sus credenciales",
			});
		}

		const updates = [];
		const values = [];

		if (email && email.trim() !== "") {
			const normalizedEmail = email.trim().toLowerCase();
			updates.push("email = ?");
			values.push(normalizedEmail);
		}

		if (nuevaContrasena && nuevaContrasena.trim() !== "") {
			const hashed = await bcrypt.hash(nuevaContrasena, 10);
			updates.push("password_hash = ?");
			values.push(hashed);
		}

		if (updates.length === 0) {
			return res.status(400).json({ error: "No hay datos para actualizar" });
		}

		values.push(patientId);

		await query(`UPDATE Users SET ${updates.join(", ")} WHERE id = ?`, values);

		res.json({
			success: true,
			message: "Credenciales actualizadas correctamente",
		});
	} catch (err) {
		console.error("Error al actualizar credenciales de paciente:", err);
		res
			.status(500)
			.json({ error: "Error interno al actualizar las credenciales" });
	}
};

// Función para desactivar cuenta de paciente
exports.deactivatePatientAccount = async (req, res) => {
	try {
		const patientId = req.user?.userId;
		const role = req.user?.role;

		if (role !== "paciente") {
			return res
				.status(403)
				.json({ error: "Solo los pacientes pueden desactivar su cuenta" });
		}

		const [user] = await query(
			'SELECT * FROM Users WHERE id = ? AND role = "paciente"',
			[patientId],
		);

		if (!user) {
			return res.status(404).json({ error: "Paciente no encontrado" });
		}

		await query('UPDATE Users SET status = "inactivo" WHERE id = ?', [
			patientId,
		]);

		res.json({ success: true, message: "Cuenta desactivada exitosamente" });
	} catch (err) {
		console.error("Error al desactivar cuenta de paciente:", err);
		res.status(500).json({ error: "Error interno del servidor" });
	}
};

//obtener TODA la info del usuario:
exports.getPatientFullInfo = async (req, res) => {
	try {
		const userId = req.user.userId;
		const role = req.user.role;

		if (role !== "paciente") {
			return res.status(403).json({
				error: "Solo los pacientes pueden acceder a esta información",
			});
		}

		//  Obtener información básica del usuario
		const [userData] = await query("SELECT * FROM Users WHERE id = ?", [
			userId,
		]);
		if (userData.length === 0) {
			return res.status(404).json({ error: "Usuario no encontrado" });
		}

		const user = userData[0];

		//  Obtener información del paciente
		const [patientData] = await query(
			"SELECT * FROM Patients WHERE user_id = ?",
			[userId],
		);
		if (patientData.length === 0) {
			return res.status(404).json({ error: "Paciente no encontrado" });
		}

		const patient = patientData[0];
		const patientId = patient.id;

		//  Obtener información  segun el tipo de paciente
		let patientSpecificData = {};

		switch (patient.patient_type) {
			case "bebe": {
				const [babyData] = await query(
					"SELECT * FROM BabyData WHERE patient_id = ?",
					[patientId],
				);
				patientSpecificData = {
					type: "baby",
					data: babyData[0] || {},
				};
				break;
			}
			case "nino": {
				const [childData] = await query(
					"SELECT * FROM ChildData WHERE patient_id = ?",
					[patientId],
				);
				patientSpecificData = {
					type: "child",
					data: childData[0] || {},
				};
				break;
			}
			case "adolescente": {
				const [adolescentData] = await query(
					"SELECT * FROM AdolescentData WHERE patient_id = ?",
					[patientId],
				);
				patientSpecificData = {
					type: "adolescent",
					data: adolescentData[0] || {},
				};
				break;
			}
			case "mujer_reproductiva": {
				const [womanData] = await query(
					"SELECT * FROM ReproductiveWomanData WHERE patient_id = ?",
					[patientId],
				);
				patientSpecificData = {
					type: "reproductive_woman",
					data: womanData[0] || {},
				};
				break;
			}
			case "adulto": {
				const [adultData] = await query(
					"SELECT * FROM AdultData WHERE patient_id = ?",
					[patientId],
				);
				patientSpecificData = {
					type: "adult",
					data: adultData[0] || {},
				};
				break;
			}
			default: {
				patientSpecificData = {
					type: "unknown",
					data: {},
				};
			}
		}

		// Obtener antecedentes fam
		const [familyHistory] = await query(
			"SELECT * FROM FamilyHistory WHERE patient_id = ?",
			[patientId],
		);

		//  Obtener documentos
		const [documents] = await query(
			`
      SELECT id, type, file_path, notes, status, date 
      FROM Documents 
      WHERE patient_id = ?
      ORDER BY date DESC
    `,
			[patientId],
		);

		// Obtener consultas medicas
		const [consultations] = await query(
			`
      SELECT c.* 
      FROM Consultations c
      WHERE c.patient_id = ?
      ORDER BY c.date DESC
    `,
			[patientId],
		);

		// Obtener citas
		const [appointments] = await query(
			`
      SELECT a.*, 
             CONCAT(p.first_name, ' ', p.last_name) AS patient_name
      FROM Appointments a
      JOIN Patients p ON a.patient_id = p.id
      WHERE a.patient_id = ?
      ORDER BY a.date_time DESC
    `,
			[patientId],
		);

		//  Obtener vacunas
		let vaccines = [];
		if (patient.patient_type === "bebe" || patient.patient_type === "nino") {
			const [vaccineData] = await query(
				`
        SELECT * FROM Vaccines 
        WHERE patient_id = ?
        ORDER BY application_date DESC
      `,
				[patientId],
			);
			vaccines = vaccineData;
		}

		// Obtener historial de cambios
		const [changeHistory] = await query(
			`
     SELECT h.*, 
         u.email AS modified_by_email
    FROM PatientChangeHistory h
    LEFT JOIN Users u ON h.modified_by = u.id
    WHERE h.patient_id = ?
    ORDER BY h.modification_date DESC
   `,
			[patientId],
		);

		//  Obtener signos vitales de las consultas
		const consultationsWithVitals = await Promise.all(
			consultations.map(async (consultation) => {
				const [vitalSigns] = await query(
					`
          SELECT * FROM VitalSigns 
          WHERE consultation_id = ?
        `,
					[consultation.id],
				);

				return {
					...consultation,
					vital_signs: vitalSigns[0] || null,
				};
			}),
		);

		// Estructurar todos los datos en un solo objeto
		const fullPatientInfo = {
			user: {
				id: user.id,
				email: user.email,
				phone: user.phone,
				status: user.status,
				profile_picture: user.profile_picture,
				last_access: user.last_access,
				created_at: user.created_at,
			},
			patient: {
				...patient,
				age: calculateAge(patient.birth_date),
				full_name: `${patient.first_name} ${patient.last_name}`,
			},
			patient_type_data: patientSpecificData,
			family_history: familyHistory,
			documents: documents,
			consultations: consultationsWithVitals,
			appointments: appointments,
			vaccines: vaccines,
			change_history: changeHistory,
			stats: {
				total_consultations: consultations.length,
				total_appointments: appointments.length,
				last_consultation: consultations[0]?.date || null,
				next_appointment:
					appointments.find((a) => new Date(a.date_time) > new Date())
						?.date_time || null,
			},
		};

		res.json({
			success: true,
			data: fullPatientInfo,
		});
	} catch (error) {
		console.error("Error al obtener información completa del paciente:", error);
		res.status(500).json({
			error: "Error interno del servidor al obtener información del paciente",
			detail:
				process.env.NODE_ENV === "development" ? error.message : undefined,
		});
	}
};
exports.revokeRefreshToken = async (req, res) => {
	try {
		const { refresh_token } = req.body;

		if (!refresh_token) {
			return res.status(400).json({ error: "Se requiere el refresh token" });
		}

		await query("DELETE FROM RefreshTokens WHERE token = ?", [refresh_token]);

		res.json({ success: true, message: "Token revocado exitosamente" });
	} catch (error) {
		console.error("Error al revocar token:", error);
		res.status(500).json({ error: "Error al revocar refresh token" });
	}
};
