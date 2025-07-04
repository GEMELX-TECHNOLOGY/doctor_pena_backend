const { query } = require("../config/db.sql");

// Crear una nueva prescripción médica
exports.createPrescription = async (req, res) => {
	try {
		const { consultation_id, instructions, print_size } = req.body;

		// Verificar si ya existe una prescripción para esta consulta
		const [exists] = await query(
			"SELECT id FROM Prescriptions WHERE consultation_id = ?",
			[consultation_id],
		);
		if (exists.length > 0) {
			return res.status(409).json({
				error: "Ya existe una prescripción para esta consulta",
			});
		}

		// Registrar la nueva prescripción
		await query(
			`INSERT INTO Prescriptions (consultation_id, date, instructions, print_size)
       VALUES (?, NOW(), ?, ?)`,
			[consultation_id, instructions, print_size],
		);

		res.status(201).json({
			success: true,
			message: "Prescripción registrada exitosamente",
		});
	} catch (error) {
		console.error("Error al crear prescripción:", error);
		res.status(500).json({
			error: "Error interno del servidor",
		});
	}
};

// Obtener prescripción por consulta
exports.getPrescriptionByConsultation = async (req, res) => {
	try {
		const consultation_id = req.params.id;
		const [prescription] = await query(
			"SELECT * FROM Prescriptions WHERE consultation_id = ?",
			[consultation_id],
		);

		if (prescription.length === 0) {
			return res.status(404).json({
				error: "Prescripción no encontrada",
			});
		}

		res.json({
			success: true,
			prescription: prescription[0],
		});
	} catch (error) {
		console.error("Error al obtener prescripción:", error);
		res.status(500).json({
			error: "Error al obtener la prescripción",
		});
	}
};

// Obtener datos completos para imprimir prescripción
exports.getPrescriptionDataForPrinting = async (req, res) => {
	try {
		const consultation_id = req.params.id;

		// Obtener datos de la consulta y paciente
		const [consultation] = await query(
			`SELECT c.*, 
              p.registration_number AS registration_number,
              p.first_name AS patient_first_name, 
              p.last_name AS patient_last_name, 
              p.gender, 
              p.birth_date
       FROM Consultations c
       INNER JOIN Patients p ON c.patient_id = p.id
       WHERE c.id = ?`,
			[consultation_id],
		);

		if (consultation.length === 0) {
			return res.status(404).json({
				error: "Consulta no encontrada",
			});
		}

		// Obtener signos vitales
		const [vitalSigns] = await query(
			"SELECT * FROM VitalSigns WHERE consultation_id = ?",
			[consultation_id],
		);

		// Obtener prescripción principal
		const [prescription] = await query(
			"SELECT * FROM Prescriptions WHERE consultation_id = ?",
			[consultation_id],
		);

		if (prescription.length === 0) {
			return res.status(404).json({
				error: "No se encontró prescripción para esta consulta",
			});
		}

		const prescription_id = prescription[0].id;

		// Obtener medicamentos prescritos
		const [medications] = await query(
			`SELECT mr.*, p.name AS medication_name, p.formula_salt
       FROM PrescribedMedications mr
       INNER JOIN Products p ON mr.medication_id = p.id
       WHERE mr.prescription_id = ?`,
			[prescription_id],
		);

		// Obtener productos vendidos
		const [sales] = await query(
			`SELECT v.*, p.name AS product_name, p.formula_salt 
       FROM Sales v
       INNER JOIN Products p ON v.product_id = p.id
       WHERE v.prescription_id = ?`,
			[prescription_id],
		);

		// Datos por defecto del médico
		const defaultDoctor = {
			doctor_first_name: "JOSE TRINIDAD",
			doctor_last_name: "PEÑA GARCIA",
			license_number: "7065658",
			office: "LAS PALMAS 218 FRACC LOS ALAMOS DURANGO DURANGO CP: 34146",
			schedule: "Lunes a Sábado 9am-8pm",
		};

		// Estructurar todos los datos para la impresión
		const data = {
			consultation: consultation[0],
			vital_signs: vitalSigns.length > 0 ? vitalSigns[0] : null,
			prescription: prescription[0],
			medications,
			doctor: defaultDoctor,
			sold_products: sales,
		};

		res.json({
			success: true,
			data,
		});
	} catch (error) {
		console.error("Error al generar datos para prescripción:", error);
		res.status(500).json({
			error: "Error al generar los datos de la prescripción",
		});
	}
};
