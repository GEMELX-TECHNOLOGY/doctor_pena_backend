require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { connectMySQL } = require("./config/db.sql");
const { generateAutomaticAlerts } = require("./utils/alertasAuto");

// Routes (igual que antes)
const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const verifyAndRenewToken = require("./middlewares/authMiddleware");
const doctorRoutes = require("./routes/doctorRoutes");
const consultationRoutes = require("./routes/consultationRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const vitalSignsRoutes = require("./routes/vitalSignsRoutes");

const vaccineRoutes = require("./routes/vaccineRoutes");
const familyHistoryRoutes = require("./routes/familyHistoryRoutes");
const historyRoutes = require("./routes/historyRoutes");
const productRoutes = require("./routes/productRoutes");

const documentRoutes = require("./routes/documentRoutes");
const alertRoutes = require("./routes/alertRoutes");
const saleRoutes = require("./routes/saleRoutes");
const wearableRoutes = require("./routes/wearable");

const app = express();

app.use(cors());
app.use(express.json());

(async () => {
  try {
    await connectMySQL();
    console.log("✅ Connected to MySQL");

    // Solo aquí llama a generateAutomaticAlerts, ya con conexión lista
    await generateAutomaticAlerts();

    // Levanta el servidor
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);

      if (process.env.ENABLE_MQTT === "true") {
        try {
          require("./mqtt");
          console.log("✅ MQTT client started");
        } catch (err) {
          console.error("❌ MQTT startup error:", err);
        }
      }
    });

  } catch (err) {
    console.error("❌ Failed to connect to MySQL:", err);
    process.exit(1);
  }
})();

// Middlewares y rutas fuera del IIFE, pueden quedarse aquí
app.use("/api/auth", authRoutes);
app.use("/api/patients", verifyAndRenewToken, patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/vital-signs", vitalSignsRoutes);

app.use("/api/vaccines", vaccineRoutes);
app.use("/api/family-history", familyHistoryRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/products", productRoutes);

app.use("/api/documents", documentRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/wearable", wearableRoutes);

app.use((err, _req, res) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});
