const express = require("express");
const router = express.Router();
const { admin, db } = require("../config/firebase");
const mysql = require("../config/db.sql");
const { queryHuggingFace } = require("../utils/huggingfaceClient");
const jwt = require("jsonwebtoken");

const authenticateWearable = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Acceso no autorizado" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "paciente") {
      return res.status(403).json({ error: "Solo pacientes pueden subir datos de sensores" });
    }

    if (!decoded.registration_number) {
      return res.status(400).json({ error: "Token inválido: falta registration_number" });
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      registration_number: decoded.registration_number,
    };

    next();
  } catch (error) {
    console.error("Error de autenticación:", error.message);
    if (error.name === "TokenExpiredError") return res.status(401).json({ error: "Token expirado" });
    if (error.name === "JsonWebTokenError") return res.status(401).json({ error: "Token inválido" });
    res.status(500).json({ error: "Error interno de autenticación" });
  }
};

async function generarMensajePersonalizado(historial, signosVitales) {
  const prompt = `
Eres un asistente médico. Tu única función es analizar signos vitales de pacientes y brindar orientación de salud personalizada. 
Nunca respondas con código de programación, matemáticas ni otro tema ajeno a la medicina.

Tu tarea:

1. Explica si los signos vitales están fuera del rango normal.
2. Informa con lenguaje sencillo si hay un riesgo para la salud.
3. Da al menos 2 recomendaciones claras para el paciente.
4. Si es grave, sugiere buscar atención médica inmediata.

Historial reciente de alertas del paciente:
${historial}

Signos vitales actuales del paciente:
Frecuencia cardíaca: ${signosVitales.heart_rate} bpm
Oxigenación: ${signosVitales.oxygenation}%
Temperatura: ${signosVitales.temperature} °C

Escribe un mensaje directamente al paciente (sin temas técnicos ni código):`;

  try {
    return await queryHuggingFace(prompt);
  } catch (error) {
    console.error("Error generando texto con Hugging Face:", error);
    return null;
  }
}

const analizarSignosVitales = ({ heart_rate, oxygenation, temperature }) => {
  if (heart_rate > 120 || oxygenation < 90 || temperature > 38.5 || temperature < 35) {
    return "alto riesgo";
  }
  return "normal";
};

// Ruta POST para pulsera
router.post("/upload", async (req, res) => {
  const registration_number = req.body.registration_number;
  const { heart_rate, oxygenation, temperature } = req.body;

  console.log("Datos recibidos:", { registration_number, heart_rate, oxygenation, temperature });

  try {
    const [rows] = await mysql.query("SELECT * FROM Patients WHERE registration_number = ?", [registration_number]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Paciente no encontrado en la base de datos MySQL" });
    }

    const paciente = rows[0];

    // Actualizar campo medband a true
    await mysql.query("UPDATE Patients SET medband = true WHERE registration_number = ?", [registration_number]);

    const riesgo = analizarSignosVitales({ heart_rate, oxygenation, temperature });

    let mensajeIA = null;
    if (riesgo !== "normal") {
      const [alertasPrevias] = await mysql.query(
        "SELECT message FROM Alerts WHERE recipient_id = ? ORDER BY date DESC LIMIT 5",
        [paciente.user_id]
      );

      const historial = alertasPrevias.map((a) => a.message).join("\n") || "Sin historial previo.";
      mensajeIA = await generarMensajePersonalizado(historial, { heart_rate, oxygenation, temperature });

      await mysql.query(
        "INSERT INTO Alerts (type, recipient_id, message) VALUES (?, ?, ?)",
        ["ia", paciente.user_id, mensajeIA || `Riesgo detectado: ${riesgo}`]
      );
    }

    let isEmergency = false;
    if (temperature < 35 || temperature > 38.5 || heart_rate < 50 || heart_rate > 120 || oxygenation < 90) {
      isEmergency = true;
      await mysql.query(
        "INSERT INTO Alerts (type, recipient_id, message) VALUES (?, ?, ?)",
        ["emergencia", paciente.user_id, `Emergencia detectada para el paciente ${paciente.first_name} ${paciente.last_name}`]
      );
    }

    // ✅ Guardar en Firestore incluyendo ia_message
    const newData = {
      patient_id: registration_number,
      heart_rate,
      oxygenation,
      temperature,
      isEmergency,
      ia_message: mensajeIA || "Sin riesgos detectados",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("WearableData").add(newData).then(async (ref) => {
      console.log("Documento agregado con ID:", ref.id);

      await db.collection("Historial").add({
        ...newData,
        wearableDataRef: ref.id,
      });

      res.json({
        message: "Datos guardados correctamente en Firestore",
        data: newData,
        patient: {
          id: paciente.id,
          name: `${paciente.first_name} ${paciente.last_name}`,
        },
        iaMessage: newData.ia_message,
      });
    }).catch((err) => {
      console.error("Error al guardar en Firestore:", err);
      res.status(500).json({ error: "Error al guardar en Firebase" });
    });
  } catch (error) {
    console.error("Error general al procesar:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ruta GET en tiempo real
router.get("/latest/:registration_number", async (req, res) => {
  const { registration_number } = req.params;

  try {
    const snapshot = await db
      .collection("WearableData")
      .where("patient_id", "==", registration_number)
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "No se encontraron datos del paciente" });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    res.json({
      success: true,
      data: {
        heart_rate: data.heart_rate,
        oxygenation: data.oxygenation,
        temperature: data.temperature,
        timestamp: data.timestamp,
        isEmergency: data.isEmergency,
        ia_message: data.ia_message,
      },
    });
  } catch (error) {
    console.error("Error al obtener datos recientes:", error);
    res.status(500).json({ error: "Error al obtener datos del paciente" });
  }
});

// Ruta GET historial
router.get("/historial/:registration_number", async (req, res) => {
  const { registration_number } = req.params;

  try {
    const snapshot = await db
      .collection("Historial")
      .where("patient_id", "==", registration_number)
      .orderBy("timestamp", "desc")
      .limit(50)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "No hay historial para este paciente" });
    }

    const historial = snapshot.docs.map((doc) => ({
      id: doc.id,
      heart_rate: doc.data().heart_rate,
      oxygenation: doc.data().oxygenation,
      temperature: doc.data().temperature,
      isEmergency: doc.data().isEmergency,
      ia_message: doc.data().ia_message,
      timestamp: doc.data().timestamp?.toDate() || null,
    }));

    res.json({
      success: true,
      historial,
    });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ error: "Error al consultar el historial" });
  }
});

module.exports = router;
