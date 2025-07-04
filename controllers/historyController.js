const { query } = require("../config/db.sql");

// Obtener todos los cambios de pacientes
exports.getAllChanges = async (_req, res) => {
	try {
		const [rows] = await query(
			`SELECT h.*, 
              d.first_name AS doctor_first_name,
              d.last_name AS doctor_last_name,
              p.first_name AS patient_first_name,
              p.last_name AS patient_last_name
       FROM PatientChangeHistory h
       LEFT JOIN Doctors d ON h.modified_by = d.user_id
       INNER JOIN Patients p ON h.patient_id = p.id
       ORDER BY h.modification_date DESC`,
		);

		res.json({ success: true, history: rows });
	} catch (error) {
		console.error("Error al obtener el historial general:", error);
		res.status(500).json({ error: "Error al obtener el historial de cambios" });
	}
};

// Obtener historial de cambios por paciente específico
exports.getHistoryByPatient = async (req, res) => {
	try {
		const patientId = req.params.id;

		// Obtener datos básicos del paciente
		const [patientData] = await query(
			`SELECT id, first_name, last_name, gender, birth_date, registration_number
       FROM Patients
       WHERE id = ?`,
			[patientId],
		);

		if (patientData.length === 0) {
			return res.status(404).json({ error: "Paciente no encontrado" });
		}

		const patient = patientData[0];

		// Obtener historial de cambios del paciente
		const [history] = await query(
			`SELECT h.*, 
              d.first_name AS doctor_first_name,
              d.last_name AS doctor_last_name
       FROM PatientChangeHistory h
       LEFT JOIN Doctors d ON h.modified_by = d.user_id
       WHERE h.patient_id = ?
       ORDER BY h.modification_date DESC`,
			[patientId],
		);

		res.json({
			success: true,
			patient,
			history,
		});
	} catch (error) {
		console.error("Error al obtener historial del paciente:", error);
		res
			.status(500)
			.json({ error: "Error al obtener el historial del paciente" });
	}
};
