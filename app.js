require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { generateAutomaticAlerts } = require('./utils/alertasAuto'); 
generateAutomaticAlerts();

// DB
const { connectMySQL } = require('./config/db.sql');

// Routes
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes'); 
const verifyAndRenewToken = require('./middlewares/authMiddleware');
const doctorRoutes = require('./routes/doctorRoutes'); 
const consultationRoutes = require('./routes/consultationRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes'); 
const vitalSignsRoutes = require('./routes/vitalSignsRoutes'); 
const prescriptionRoutes = require('./routes/prescriptionRoutes'); 
const vaccineRoutes = require('./routes/vaccineRoutes');
const familyHistoryRoutes = require('./routes/familyHistoryRoutes'); 
const historyRoutes = require('./routes/historyRoutes');
const productRoutes = require('./routes/productRoutes'); 
const prescribedMedsRoutes = require('./routes/prescribedMedicationRoutes');
const documentRoutes = require('./routes/documentRoutes'); 
const alertRoutes = require('./routes/alertRoutes');
const saleRoutes = require('./routes/saleRoutes'); 
const wearableRoutes = require('./routes/wearable');

const app = express();

app.use(cors());
app.use(express.json());

try {
  connectMySQL();
  console.log('✅ Connected to MySQL');
} catch (err) {
  console.error('Database connection error:', err);
  process.exit(1);
}

//  route paths
app.use('/api/auth', authRoutes);
app.use('/api/patients', verifyAndRenewToken, patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/vital-signs', vitalSignsRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/vaccines', vaccineRoutes);
app.use('/api/family-history', familyHistoryRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/products', productRoutes);
app.use('/api/prescribed-medications', prescribedMedsRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/wearable', wearableRoutes);

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (process.env.ENABLE_MQTT === 'true') {
    try {
      require('./mqtt');
      console.log('✅ MQTT client started');
    } catch (err) {
      console.error('❌ MQTT startup error:', err);
    }
  }
});