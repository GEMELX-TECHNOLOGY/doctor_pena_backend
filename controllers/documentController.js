const { query } = require("../config/db.sql");

const validTypes = [
  "receta",
  "estudio",
  "informe",
  "constancia",
  "referencia",
  "vacuna",
  "consentimiento",
  "seguimiento",
  "otro"
];

// Subir un nuevo documento a Cloudinary
exports.uploadDocument = async (req, res) => {
	try {
		const { registration_number, title, description, type, notes, status } = req.body;
		const file_path = req.file?.path;

		if (!file_path) {
			return res.status(400).json({ error: "Archivo no proporcionado" });
		}

		if (!validTypes.includes(type)) {
			return res.status(400).json({ error: "Tipo de documento no válido" });
		}

		// Obtener id paciente a partir de registration_number
		const [patients] = await query(
			"SELECT id FROM Patients WHERE registration_number = ?",
			[registration_number]
		);

		if (patients.length === 0) {
			return res.status(404).json({ error: "Paciente no encontrado" });
		}

		const patient_id = patients[0].id;

		await query(
			`INSERT INTO Documents (patient_id, title, description, type, file_path, notes, status) 
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
			[patient_id, title, description, type, file_path, notes, status],
		);

		res.status(201).json({
			success: true,
			message: "Documento subido exitosamente",
			file_url: file_path,
		});
	} catch (error) {
		console.error("Error al subir documento:", error);
		res.status(500).json({
			error: "Error al subir el documento",
		});
	}
};

// Obtener documentos por paciente
exports.getByPatient = async (req, res) => {
	try {
		const registration_number = req.params.registration_number;

		const [docs] = await query(
			`SELECT D.* FROM Documents D
			 JOIN Patients P ON D.patient_id = P.id
			 WHERE P.registration_number = ?
			 ORDER BY D.date DESC`,
			[registration_number],
		);

		res.json({
			success: true,
			documents: docs,
		});
	} catch (error) {
		console.error("Error al obtener documentos:", error);
		res.status(500).json({
			error: "Error al obtener los documentos",
		});
	}
};

// Obtener documentos por tipo
exports.getDocumentsByType = async (req, res) => {
	try {
		const { registration_number, type } = req.params;

		if (!validTypes.includes(type)) {
			return res.status(400).json({ error: "Tipo de documento no válido" });
		}

		const [docs] = await query(
			`SELECT D.* FROM Documents D
			 JOIN Patients P ON D.patient_id = P.id
			 WHERE P.registration_number = ? AND D.type = ?
			 ORDER BY D.date DESC`,
			[registration_number, type],
		);

		res.json({
			success: true,
			documents: docs,
		});
	} catch (error) {
		console.error("Error al obtener documentos por tipo:", error);
		res.status(500).json({
			error: "Error al obtener los documentos por tipo",
		});
	}
};

// Eliminar documento
exports.deleteDocument = async (req, res) => {
	try {
		const { id } = req.params;

		await query("DELETE FROM Documents WHERE id = ?", [id]);

		res.json({
			success: true,
			message: "Documento eliminado exitosamente",
		});
	} catch (error) {
		console.error("Error al eliminar documento:", error);
		res.status(500).json({
			error: "Error al eliminar el documento",
		});
	}
};

// Ver documento por id y marcar como leído
exports.viewAndMarkAsRead = async (req, res) => {
	try {
		const { id } = req.params;

		const [docs] = await query("SELECT * FROM Documents WHERE id = ?", [id]);

		if (docs.length === 0) {
			return res.status(404).json({
				error: "Documento no encontrado",
			});
		}

		const doc = docs[0];

		if (doc.status === "pendiente") {
			await query('UPDATE Documents SET status = "leido" WHERE id = ?', [id]);
			doc.status = "leido";
		}

		res.json({
			success: true,
			document: doc,
		});
	} catch (error) {
		console.error("Error al visualizar documento:", error);
		res.status(500).json({
			error: "Error al obtener el documento",
		});
	}
};

// Obtener documentos leídos por paciente
exports.getReadDocuments = async (req, res) => {
	try {
		const registration_number = req.params.registration_number;

		const [docs] = await query(
			`SELECT D.* FROM Documents D
			 JOIN Patients P ON D.patient_id = P.id
			 WHERE P.registration_number = ? AND D.status = 'leido'
			 ORDER BY D.date DESC`,
			[registration_number],
		);

		res.json({
			success: true,
			documents: docs,
		});
	} catch (error) {
		console.error("Error al obtener documentos leídos:", error);
		res.status(500).json({
			error: "Error al obtener los documentos leídos",
		});
	}
};

// Obtener documentos pendientes por paciente
exports.getPendingDocuments = async (req, res) => {
	try {
		const registration_number = req.params.registration_number;

		const [docs] = await query(
			`SELECT D.* FROM Documents D
			 JOIN Patients P ON D.patient_id = P.id
			 WHERE P.registration_number = ? AND D.status = 'pendiente'
			 ORDER BY D.date DESC`,
			[registration_number],
		);

		res.json({
			success: true,
			documents: docs,
		});
	} catch (error) {
		console.error("Error al obtener documentos pendientes:", error);
		res.status(500).json({
			error: "Error al obtener los documentos pendientes",
		});
	}
};

// Obtener todos los documentos leídos (global)
exports.getAllReadDocuments = async (_req, res) => {
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
			documents: docs,
		});
	} catch (error) {
		console.error("Error al obtener documentos leídos (global):", error);
		res.status(500).json({
			error: "Error al obtener los documentos leídos",
		});
	}
};
