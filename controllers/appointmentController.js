const { query } = require("../config/db.sql");
const { calculateAge } = require("../utils/helpers");
const { format } = require("date-fns");

const DEFAULT_DOCTOR_ID = 1; // ID del Doctor

// Verifica si ya existe una cita en esa fecha y hora
async function hasAppointmentConflict(date_time, excludeId = null) {
  let sql = `SELECT id FROM Appointments WHERE date_time = ?`;
  const params = [date_time];
  if (excludeId) {
    sql += ` AND id != ?`;
    params.push(excludeId);
  }
  const [rows] = await query(sql, params);
  return rows.length > 0;
}

// Verifica si el paciente existe y devuelve su id real
async function getPatientIdByRegistrationNumber(registration_number) {
  const [rows] = await query(
    "SELECT id FROM Patients WHERE registration_number = ?",
    [registration_number]
  );
  if (rows.length === 0) return null;
  return rows[0].id;
}

// Función auxiliar para obtener fecha actual formateada para SQL (yyyy-MM-dd HH:mm:ss)
function getCurrentDateTime() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

// Crear Cita, ahora recibe registration_number en el body en lugar de patient_id
exports.createAppointment = async (req, res) => {
  try {
    const {
      registration_number,
      date_time,
      reason,
      status = "pendiente",
      notes,
      final_status = "pendiente",
    } = req.body;

    const patient_id =
      await getPatientIdByRegistrationNumber(registration_number);
    if (!patient_id) {
      return res.status(400).json({ error: "Paciente no encontrado" });
    }

    if (await hasAppointmentConflict(date_time)) {
      return res
        .status(409)
        .json({ error: "Ya existe una cita en esa fecha y hora" });
    }

    await query(
      `INSERT INTO Appointments (patient_id, date_time, reason, status, notes, final_status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [patient_id, date_time, reason, status, notes, final_status]
    );

    const [patientData] = await query(
      `SELECT first_name, last_name FROM Patients WHERE id = ?`,
      [patient_id]
    );
    const patientName =
      patientData.length > 0
        ? `${patientData[0].first_name} ${patientData[0].last_name}`
        : "Patient";

    const alertDate = getCurrentDateTime();

    await query(
      `INSERT INTO Alerts (type, recipient_id, message, date, is_read) VALUES ('cita', ?, ?, ?, 0)`,
      [patient_id, `You have an appointment on ${date_time}`, alertDate]
    );

    await query(
      `INSERT INTO Alerts (type, recipient_id, message, date, is_read) VALUES ('cita', ?, ?, ?, 0)`,
      [
        DEFAULT_DOCTOR_ID,
        `You have an appointment with patient ${patientName} on ${date_time}`,
        alertDate,
      ]
    );

    res
      .status(201)
      .json({ success: true, message: "Cita creada y alertas generadas" });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({ error: "Error al crear cita" });
  }
};

// Actualizar Cita (por id de cita, no cambia)
exports.updateAppointment = async (req, res) => {
  try {
    const { date_time, reason, status, notes } = req.body;

    const [currentAppointment] = await query(
      "SELECT * FROM Appointments WHERE id = ?",
      [req.params.id]
    );

    if (currentAppointment.length === 0) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    const appointment = currentAppointment[0];
    let newStatus = status || appointment.status;

    if (date_time && date_time !== appointment.date_time) {
      const conflict = await hasAppointmentConflict(date_time, appointment.id);
      if (conflict) {
        return res.status(409).json({ error: "Ese horario ya está ocupado" });
      }
      newStatus = "reprogramada";
    }

    await query(
      `UPDATE Appointments SET date_time = ?, reason = ?, status = ?, notes = ? WHERE id = ?`,
      [
        date_time || appointment.date_time,
        reason || appointment.reason,
        newStatus,
        notes || appointment.notes,
        req.params.id,
      ]
    );

    const [patientData] = await query(
      `SELECT first_name, last_name, user_id FROM Patients WHERE id = ?`,
      [appointment.patient_id]
    );

    const patientName =
      patientData.length > 0
        ? `${patientData[0].first_name} ${patientData[0].last_name}`
        : "Paciente";

    const patientUserId = patientData[0]?.user_id;
    const newDate = date_time || appointment.date_time;
    const alertDate = getCurrentDateTime();

    // Notificación al paciente (si tiene user_id)
    if (patientUserId) {
      await query(
        `INSERT INTO Alerts (type, recipient_id, message, date, is_read) VALUES ('cita', ?, ?, ?, 0)`,
        [
          patientUserId,
          `Tu cita ha sido ${
            newStatus === "reprogramada" ? "reprogramada" : "actualizada"
          }: ${newDate}`,
          alertDate,
        ]
      );
    }

    // Notificación al doctor
    await query(
      `INSERT INTO Alerts (type, recipient_id, message, date, is_read) VALUES ('cita', ?, ?, ?, 0)`,
      [
        DEFAULT_DOCTOR_ID,
        `Cita ${
          newStatus === "reprogramada" ? "reprogramada" : "actualizada"
        } con ${patientName} para el ${newDate}`,
        alertDate,
      ]
    );

    res.json({
      success: true,
      message: `Cita ${newStatus} y alertas enviadas correctamente`,
    });
  } catch (err) {
    console.error("Error actualizando cita:", err);
    res.status(500).json({ error: "Error actualizando cita" });
  }
};

// Cancelar cita
exports.cancelAppointment = async (req, res) => {
  try {
    const [result] = await query(
      `UPDATE Appointments SET status = 'cancelada' WHERE id = ?`,
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }
    res.json({ success: true, message: "Cita cancelada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error cancelando cita" });
  }
};

// Marcar cita como completada
exports.markAsCompleted = async (req, res) => {
  try {
    const [appointment] = await query(
      `SELECT final_status FROM Appointments WHERE id = ?`,
      [req.params.id]
    );

    if (appointment.length === 0) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    if (appointment[0].final_status === "completada") {
      return res.status(200).json({
        success: true,
        message: "Cita ya estaba marcada como completa",
      });
    }

    const [result] = await query(
      `UPDATE Appointments SET final_status = 'completada' WHERE id = ?`,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(500)
        .json({ error: "Fallo al actualizar final_status" });
    }

    res.json({
      success: true,
      message: "Cita marcada como completa",
    });
  } catch (err) {
    console.error("Error updating final_status:", err);
    res.status(500).json({ error: "Error actualizando final_status" });
  }
};

// Obtener citas por paciente
exports.getAppointmentsByPatient = async (req, res) => {
  try {
    const registrationNumber = req.params.registration_number;

    const patient_id =
      await getPatientIdByRegistrationNumber(registrationNumber);
    if (!patient_id) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    const [rows] = await query(
      `SELECT * FROM Appointments WHERE patient_id = ? ORDER BY date_time ASC`,
      [patient_id]
    );
    res.json({ success: true, appointments: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo citas de paciente" });
  }
};

// Obtener todas las citas
exports.getAllAppointments = async (_req, res) => {
  try {
    const [appointments] = await query(
      `SELECT * FROM Appointments ORDER BY date_time ASC`
    );

    const appointmentsWithPatient = await Promise.all(
      appointments.map(async (appointment) => {
        const [patientData] = await query(
          `SELECT registration_number, first_name, last_name, birth_date 
           FROM Patients WHERE id = ?`,
          [appointment.patient_id]
        );

        let patient = null;
        if (patientData.length > 0) {
          const p = patientData[0];
          patient = {
            registration_number: p.registration_number,
            first_name: p.first_name,
            last_name: p.last_name,
            age: calculateAge(p.birth_date),
          };
        }

        const formattedDate = format(
          new Date(appointment.date_time),
          "dd-MM-yyyy - hh:mm a"
        );

        return {
          id: appointment.id,
          patient_id: appointment.patient_id,
          date_time: formattedDate,
          reason: appointment.reason,
          status: appointment.status,
          final_status: appointment.final_status,
          ...(appointment.status === "cancelada" ||
          appointment.status === "reprogramada"
            ? { notes: appointment.notes }
            : {}),
          patient,
        };
      })
    );

    res.json({ success: true, appointments: appointmentsWithPatient });
  } catch (err) {
    console.error("Error getting all appointments:", err);
    res.status(500).json({ error: "Error obteniendo todas las citas" });
  }
};

// Cambiar estado de una cita
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "pendiente",
      "reprogramada",
      "cancelada",
      "confirmada",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Status inválido" });
    }

    const [result] = await query(
      `UPDATE Appointments SET status = ? WHERE id = ?`,
      [status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    res.json({ success: true, message: `Status actualizado a ${status}` });
  } catch (err) {
    console.error("Error actualizando status:", err);
    res.status(500).json({ error: "Error actualizando status" });
  }
};

// Obtener la próxima cita del paciente
exports.getNextAppointmentByPatient = async (req, res) => {
  try {
    const registrationNumber = req.params.registration_number;

    const patient_id =
      await getPatientIdByRegistrationNumber(registrationNumber);
    if (!patient_id) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    const [rows] = await query(
      `SELECT * FROM Appointments 
       WHERE patient_id = ? AND status IN ('pendiente', 'confirmada', 'reprogramada') AND date_time > NOW()
       ORDER BY date_time ASC 
       LIMIT 1`,
      [patient_id]
    );

    if (rows.length === 0) {
      return res.json({ success: true, appointment: null });
    }

    res.json({ success: true, appointment: rows[0] });
  } catch (err) {
    console.error("Error al obtener próxima cita del paciente:", err);
    res
      .status(500)
      .json({ error: "Error al obtener próxima cita del paciente" });
  }
};

// Obtener la próxima cita del doctor
exports.getNextAppointmentByDoctor = async (_req, res) => {
  try {
    const [rows] = await query(
      `SELECT A.*, P.*, U.email, U.phone
       FROM Appointments A
       JOIN Patients P ON A.patient_id = P.id
	   JOIN Users U ON P.user_id = U.id
       WHERE A.status IN ('pendiente', 'confirmada', 'reprogramada') AND A.date_time > NOW()
       ORDER BY A.date_time ASC 
       LIMIT 1`
    );

    if (rows.length === 0) {
      return res.json({ success: true, appointment: null });
    }

    res.json({ success: true, appointment: rows[0] });
  } catch (err) {
    console.error("Error al obtener próxima cita del doctor:", err);
    res.status(500).json({ error: "Error al obtener próxima cita del doctor" });
  }
};
