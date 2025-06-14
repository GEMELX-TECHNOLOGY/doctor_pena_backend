require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { generarAlertasAutomaticas } = require('./utils/alertasAuto');
generarAlertasAutomaticas();

// BD
const { connectMySQL } = require('./config/db.sql'); // Conexión a MySQL


// rutas
const authRoutes = require('./routes/authRoutes');
const pacienteRoutes = require('./routes/patientRoutes');
const verificarYRenovarToken = require('./middlewares/authMiddleware');
const medicoRoutes = require('./routes/doctorRoutes');
const consultaRoutes = require('./routes/consultationRoutes');
const citaRoutes = require('./routes/appointmentRoutes');
const signosRoutes = require('./routes/vitalSignsRoutes');
const recetaRoutes = require('./routes/prescriptionRoutes');
const vaccineRoutes = require('./routes/vaccineRoutes');
const antecedenteRoutes = require('./routes/familyHistoryRoutes');
const historialRoutes = require('./routes/historyRoutes');
const productosRoutes = require('./routes/productRoutes');
const medRecetadosRoutes = require('./routes/prescribedMedicationRoutes');
const documentosRoutes = require('./routes/documentRoutes');
const alertasRoutes = require('./routes/alertRoutes');
const ventaRoutes = require('./routes/saleRoutes');
const wearableRoutes = require('./routes/wearable');

// instancia de Express
const app = express();

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Conexiones a BD 
try {
  connectMySQL(); 
  console.log('✅ Conectado a MySQL');
  // Firebase ya se conectó al importar 'db'
} catch (err) {
  console.error('Error al conectar a las bases de datos:', err);
  process.exit(1); // Salir si no podemos conectar a las DBs
}



// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', verificarYRenovarToken, pacienteRoutes);
app.use('/api/medicos', medicoRoutes);
app.use('/api/consultas', consultaRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/signos-vitales', signosRoutes);
app.use('/api/recetas', recetaRoutes);
app.use('/api/vacunas', vaccineRoutes);
app.use('/api/antecedentes', antecedenteRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/med-recetados', medRecetadosRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/wearable', wearableRoutes);

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message,
  });
});


// server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
});
