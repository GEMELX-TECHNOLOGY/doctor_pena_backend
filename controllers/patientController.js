const { query } = require('../config/db.sql');
const { generateCustomId, calculateAge,detectPatientChanges } = require('../utils/helpers');

// Tipos de sangre válidos
const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
// Tipos de paciente válidos
const validPatientTypes = ['bebe', 'nino', 'adolescente', 'mujer_reproductiva', 'adulto'];

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
      patient_type: patient_type_input
    } = req.body;

    // Validar tipo de sangre
    if (!validBloodTypes.includes(blood_type)) {
      return res.status(400).json({ error: 'Tipo de sangre no válido' });
    }

    const age = calculateAge(birth_date);
    const registration_number = await generateCustomId();

    // Usar el tipo enviado o calcular por edad/género si no se envía
    let patient_type = patient_type_input || null;

    if (patient_type) {
      if (!validPatientTypes.includes(patient_type)) {
        return res.status(400).json({ error: 'Tipo de paciente no válido' });
      }
    } else {
      // Asignación automática si no se envió desde el frontend
      if (age <= 2) patient_type = 'bebe';
      else if (age <= 12) patient_type = 'nino';
      else if (age >= 13 && age <= 17) patient_type = 'adolescente';
      else if (age >= 18 && age <= 49 && gender.toLowerCase() === 'femenino') patient_type = 'mujer_reproductiva';
      else patient_type = 'adulto';
    }

    // Insertar datos básicos del paciente
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
        photo
      ]
    );

    const patientId = result.insertId;

    // Insertar datos específicos según tipo de paciente
    switch (patient_type) {
      case 'bebe':
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
            baby_data?.notes || null
          ]
        );
        break;

      case 'nino':
        await query(
          `INSERT INTO ChildData (patient_id, guardian_name, emergency_phone, common_allergies, extracurricular_activities) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            patientId,
            child_data?.guardian_name || null,
            child_data?.emergency_phone || null,
            child_data?.common_allergies || null,
            child_data?.extracurricular_activities || null
          ]
        );
        break;

      case 'adolescente':
        await query(
          `INSERT INTO AdolescentData (patient_id, education, lives_with_parents, physical_activity) 
           VALUES (?, ?, ?, ?)`,
          [
            patientId,
            adolescent_data?.education || null,
            adolescent_data?.lives_with_parents || null,
            adolescent_data?.physical_activity || null
          ]
        );
        break;

      case 'mujer_reproductiva':
        await query(
          `INSERT INTO ReproductiveWomanData (patient_id, last_menstruation_date, contraceptive_method, previous_pregnancies, irregular_cycles) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            patientId,
            reproductive_woman_data?.last_menstruation_date || null,
            reproductive_woman_data?.contraceptive_method || null,
            reproductive_woman_data?.previous_pregnancies || null,
            reproductive_woman_data?.irregular_cycles || null
          ]
        );
        break;

      case 'adulto':
        await query(
          `INSERT INTO AdultData (patient_id, occupation, marital_status, education) 
           VALUES (?, ?, ?, ?)`,
          [
            patientId,
            adult_data?.occupation || null,
            adult_data?.marital_status || null,
            adult_data?.education || null
          ]
        );
        break;
    }

    res.status(201).json({
      success: true,
      message: 'Paciente registrado exitosamente',
      registration_number,
      age,
      patient_type
    });

  } catch (error) {
    console.error('Error al registrar paciente:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      detail: error.message 
    });
  }
};



// Obtener todos los pacientes
exports.getAllPatients = async (req, res) => {
  try {
    const [patients] = await query('SELECT * FROM Patients');
    res.json({ success: true, patients });
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({ error: 'Error al obtener los pacientes' });
  }
};

// Obtener paciente por ID
exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await query('SELECT * FROM Patients WHERE id = ?', [id]);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    res.json({ success: true, patient: result[0] });
  } catch (error) {
    console.error('Error al obtener paciente:', error);
    res.status(500).json({ error: 'Error al obtener el paciente' });
  }
};

// Actualizar información del paciente
exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const modifierId = req.user.userId;

    // Validar tipo de sangre si se actualiza
    if (fields.blood_type && !validBloodTypes.includes(fields.blood_type)) {
      return res.status(400).json({ error: 'Tipo de sangre no válido' });
    }

    // Obtener datos originales del paciente
    const [original] = await query('SELECT * FROM Patients WHERE id = ?', [id]);
    if (original.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Detectar cambios en los datos
    const changes = detectPatientChanges(original[0], fields);

    if (changes.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No hay cambios en los datos del paciente' 
      });
    }

    // Construir consulta de actualización
    const fieldsSet = Object.keys(fields).map(key => `${key} = ?`).join(', ');
    const values = Object.values(fields);

    // Actualizar paciente
    await query(`UPDATE Patients SET ${fieldsSet} WHERE id = ?`, [...values, id]);

    // Registrar cambios en el historial
    for (const change of changes) {
      await query(
        `INSERT INTO PatientChangeHistory
         (patient_id, modified_field, old_value, new_value, modified_by)
         VALUES (?, ?, ?, ?, ?)`,
        [
          id,
          change.field,
          String(change.old ?? ''),
          String(change.new),
          modifierId
        ]
      );
    }

    res.json({
      success: true,
      message: 'Paciente actualizado exitosamente',
      changes
    });

  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    res.status(500).json({ error: 'Error al actualizar el paciente' });
  }
};

// Eliminar paciente
exports.deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Patients WHERE id = ?', [id]);

    res.json({ 
      success: true, 
      message: 'Paciente eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    res.status(500).json({ error: 'Error al eliminar el paciente' });
  }
};