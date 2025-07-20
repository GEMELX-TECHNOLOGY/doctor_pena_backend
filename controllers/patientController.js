const { query } = require("../config/db.sql");
const {
	generateCustomId,
	calculateAge,
	detectPatientChanges,
} = require("../utils/helpers");

// Tipos de sangre válidos
const validBloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
// Tipos de paciente válidos
const validPatientTypes = [
	"bebe",
	"nino",
	"adolescente",
	"mujer_reproductiva",
	"adulto",
];

exports.registerPatientWeb = async (req, res) => {
	try {
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
			photo,
			baby_data,
			child_data,
			adolescent_data,
			reproductive_woman_data,
			adult_data,
			patient_type: patient_type_input,
		} = req.body;

		// Validar tipo de sangre
		if (!validBloodTypes.includes(blood_type)) {
			return res.status(400).json({ error: "Tipo de sangre no válido" });
		}

		const age = calculateAge(birth_date);
		const registration_number = await generateCustomId();

		// Asignar foto por defecto si no se envía
		const photoToUse =
			photo && photo.trim() !== ""
				? photo
				: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOxYHstHPaqXtUZFjxrqn88O3mGfNcNXMlwQ&s";

		// Validar o asignar tipo paciente
		let patient_type = patient_type_input || null;
		if (patient_type) {
			if (!validPatientTypes.includes(patient_type)) {
				return res.status(400).json({ error: "Tipo de paciente no válido" });
			}
		} else {
			if (age <= 2) patient_type = "bebe";
			else if (age <= 12) patient_type = "nino";
			else if (age >= 13 && age <= 17) patient_type = "adolescente";
			else if (age >= 18 && age <= 49 && gender.toLowerCase() === "femenino")
				patient_type = "mujer_reproductiva";
			else patient_type = "adulto";
		}

		// Insertar datos básicos del paciente, usando photoToUse
		const [result] = await query(
			`INSERT INTO Patients 
       (registration_number, first_name, last_name, gender, birth_date, blood_type, allergies, chronic_diseases, average_height, average_weight, patient_type, photo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				registration_number,
				first_name,
				last_name,
				gender,
				birth_date,
				blood_type,
				allergies,
				chronic_diseases,
				average_height,
				average_weight,
				patient_type,
				photoToUse,
			],
		);

		const patientId = result.insertId;

		// Insertar datos específicos según tipo de paciente
		switch (patient_type) {
			case "bebe":
				await query(
					`INSERT INTO BabyData (patient_id, feeding_type, complete_vaccines, feeding_frequency, birth_weight, birth_height, notes) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
					[
						patientId,
						baby_data?.feeding_type || null,
						baby_data?.complete_vaccines || null,
						baby_data?.feeding_frequency || null,
						baby_data?.birth_weight || null,
						baby_data?.birth_height || null,
						baby_data?.notes || null,
					],
				);
				break;

			case "nino":
				await query(
					`INSERT INTO ChildData (patient_id, guardian_name, emergency_phone, common_allergies, extracurricular_activities) 
           VALUES (?, ?, ?, ?, ?)`,
					[
						patientId,
						child_data?.guardian_name || null,
						child_data?.emergency_phone || null,
						child_data?.common_allergies || null,
						child_data?.extracurricular_activities || null,
					],
				);
				break;

			case "adolescente":
				await query(
					`INSERT INTO AdolescentData (patient_id, education, lives_with_parents, physical_activity) 
           VALUES (?, ?, ?, ?)`,
					[
						patientId,
						adolescent_data?.education || null,
						adolescent_data?.lives_with_parents || null,
						adolescent_data?.physical_activity || null,
					],
				);
				break;

			case "mujer_reproductiva":
				await query(
					`INSERT INTO ReproductiveWomanData (patient_id, last_menstruation_date, contraceptive_method, previous_pregnancies, irregular_cycles) 
           VALUES (?, ?, ?, ?, ?)`,
					[
						patientId,
						reproductive_woman_data?.last_menstruation_date || null,
						reproductive_woman_data?.contraceptive_method || null,
						reproductive_woman_data?.previous_pregnancies || null,
						reproductive_woman_data?.irregular_cycles || null,
					],
				);
				break;

			case "adulto":
				await query(
					`INSERT INTO AdultData (patient_id, occupation, marital_status, education) 
           VALUES (?, ?, ?, ?)`,
					[
						patientId,
						adult_data?.occupation || null,
						adult_data?.marital_status || null,
						adult_data?.education || null,
					],
				);
				break;
		}

		res.status(201).json({
			success: true,
			message: "Paciente registrado exitosamente",
			registration_number,
			age,
			patient_type,
			photo: photoToUse,
		});
	} catch (error) {
		console.error("Error al registrar paciente:", error);
		res.status(500).json({
			error: "Error interno del servidor",
			detail: error.message,
		});
	}
};


// Obtener todos los pacientes
exports.getAllPatients = async (_req, res) => {
	try {
		const [patients] = await query("SELECT * FROM Patients");
		res.json({ success: true, patients });
	} catch (error) {
		console.error("Error al obtener pacientes:", error);
		res.status(500).json({ error: "Error al obtener los pacientes" });
	}
};

// Eliminar paciente
exports.deletePatient = async (req, res) => {
	try {
		const { id } = req.params;
		await query("DELETE FROM Patients WHERE id = ?", [id]);

		res.json({
			success: true,
			message: "Paciente eliminado exitosamente",
		});
	} catch (error) {
		console.error("Error al eliminar paciente:", error);
		res.status(500).json({ error: "Error al eliminar el paciente" });
	}
};
exports.getPatientByRegistrationNumber = async (req, res) => {
	try {
		const { registration_number } = req.params;

		const [result] = await query(
			"SELECT * FROM Patients WHERE registration_number = ?",
			[registration_number],
		);
		if (result.length === 0) {
			return res.status(404).json({ error: "Paciente no encontrado" });
		}

		const patient = result[0];
		const patientType = patient.patient_type;
		const patientId = patient.id;

		// Separar alergias en un arreglo
		const allergyList = patient.allergies
			? patient.allergies
					.split(",")
					.map((a) => a.trim())
					.filter((a) => a !== "")
			: [];

		//  Datos adicionales por tipo de paciente
		const extraData = [];
		let vaccines = [];

		switch (patientType) {
			case "bebe": {
				const [babyData] = await query(
					"SELECT * FROM BabyData WHERE patient_id = ?",
					[patientId],
				);
				if (babyData.length)
					extraData.push({ type: "bebe", data: babyData[0] });

				const [babyVaccines] = await query(
					"SELECT * FROM Vaccines WHERE patient_id = ?",
					[patientId],
				);
				vaccines = babyVaccines;
				break;
			}
			case "nino": {
				const [childData] = await query(
					"SELECT * FROM ChildData WHERE patient_id = ?",
					[patientId],
				);
				if (childData.length)
					extraData.push({ type: "nino", data: childData[0] });

				const [childVaccines] = await query(
					"SELECT * FROM Vaccines WHERE patient_id = ?",
					[patientId],
				);
				vaccines = childVaccines;
				break;
			}
			case "adolescente": {
				const [adolescentData] = await query(
					"SELECT * FROM AdolescentData WHERE patient_id = ?",
					[patientId],
				);
				if (adolescentData.length)
					extraData.push({ type: "adolescente", data: adolescentData[0] });
				break;
			}
			case "mujer_reproductiva": {
				const [reproductiveData] = await query(
					"SELECT * FROM ReproductiveWomanData WHERE patient_id = ?",
					[patientId],
				);
				if (reproductiveData.length)
					extraData.push({
						type: "mujer_reproductiva",
						data: reproductiveData[0],
					});
				break;
			}
			case "adulto": {
				const [adultData] = await query(
					"SELECT * FROM AdultData WHERE patient_id = ?",
					[patientId],
				);
				if (adultData.length)
					extraData.push({ type: "adulto", data: adultData[0] });
				break;
			}
		}

		//  Signos vitales
		const [vitalSigns] = await query(
			`
     SELECT VS.*, C.date AS consultation_date
     FROM VitalSigns VS
     JOIN Consultations C ON VS.consultation_id = C.id
     WHERE C.patient_id = ?
     ORDER BY C.date DESC
     `,
			[patientId],
		);

		//  Antecedentes familiares
		const [familyHistory] = await query(
			"SELECT * FROM FamilyHistory WHERE patient_id = ?",
			[patientId],
		);

		res.json({
			success: true,
			patient,
			allergy_list: allergyList,
			extra_data: extraData,
			vaccines,
			vital_signs: vitalSigns,
			family_history: familyHistory,
		});
	} catch (error) {
		console.error("Error al obtener paciente:", error);
		res.status(500).json({ error: "Error al obtener el paciente" });
	}
};

exports.updatePatientByRegistrationNumber = async (req, res) => {
	try {
		const { registration_number } = req.params;
		const fields = req.body;
		const modifierId = req.user.userId;

		if (fields.blood_type && !validBloodTypes.includes(fields.blood_type)) {
			return res.status(400).json({ error: "Tipo de sangre no válido" });
		}

		const [original] = await query(
			"SELECT * FROM Patients WHERE registration_number = ?",
			[registration_number],
		);
		if (original.length === 0) {
			return res.status(404).json({ error: "Paciente no encontrado" });
		}

		const patientId = original[0].id;

		const changes = detectPatientChanges(original[0], fields);
		if (changes.length === 0) {
			return res.json({
				success: true,
				message: "No hay cambios en los datos del paciente",
			});
		}

		const fieldsSet = Object.keys(fields)
			.map((key) => `${key} = ?`)
			.join(", ");
		const values = Object.values(fields);

		await query(
			`UPDATE Patients SET ${fieldsSet} WHERE registration_number = ?`,
			[...values, registration_number],
		);

		for (const change of changes) {
			await query(
				`INSERT INTO PatientChangeHistory 
         (patient_id, modified_field, old_value, new_value, modified_by) 
         VALUES (?, ?, ?, ?, ?)`,
				[
					patientId,
					change.field,
					String(change.old ?? ""),
					String(change.new),
					modifierId,
				],
			);
		}

		res.json({
			success: true,
			message: "Paciente actualizado exitosamente",
			changes,
		});
	} catch (error) {
		console.error("Error al actualizar paciente:", error);
		res.status(500).json({ error: "Error al actualizar el paciente" });
	}
};
// Obtener pacientes con MedBand activado
exports.getPatientsWithMedband = async (_req, res) => {
	try {
		const [patients] = await query(
			"SELECT first_name, last_name FROM Patients WHERE medband = true"
		);

		res.json({
			success: true,
			count: patients.length,
			patients,
		});
	} catch (error) {
		console.error("Error al obtener pacientes con MedBand:", error);
		res.status(500).json({ error: "Error al obtener pacientes con MedBand" });
	}
};
