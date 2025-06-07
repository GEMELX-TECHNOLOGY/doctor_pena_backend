require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { generarAlertasAutomaticas } = require('./utils/alertasAuto');
generarAlertasAutomaticas();
const alertasJob = require('./jobs/alertasJob');
// BD
const { connectMySQL } = require('./config/db.sql'); // Conexión a MySQL
const { connectMongoDB } = require('./config/db.mongo'); // Conexión a MongoDB

// rutas
const authRoutes = require('./routes/authRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');
const verificarYRenovarToken = require('./middlewares/authMiddleware');
const medicoRoutes = require('./routes/medicoRoutes');
const consultaRoutes = require('./routes/consultaRoutes');
const citaRoutes = require('./routes/citaRoutes');
const signosRoutes = require('./routes/signosRoutes');
const recetaRoutes = require('./routes/recetaRoutes');
const vacunaRoutes = require('./routes/vacunaRoutes');
const antecedenteRoutes = require('./routes/antecedenteRoutes');
const historialRoutes = require('./routes/historialRoutes');
const productosRoutes = require('./routes/productosRoutes');
const medRecetadosRoutes = require('./routes/medRecetadosRoutes');
const documentosRoutes = require('./routes/documentosRoutes');
const alertasRoutes = require('./routes/alertasRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
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
  
  connectMongoDB(); 
  console.log('✅ Conectado a MongoDB');
} catch (err) {
  console.error('Error al conectar a las bases de datos:', err);
  process.exit(1); // Salir si no podemos conectar a las DBs
}
// Rutas
app.use('/api/auth',authRoutes);
app.use('/api/pacientes',verificarYRenovarToken, pacienteRoutes);
app.use('/api/medicos', medicoRoutes);
app.use('/api/consultas', consultaRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/signos-vitales', signosRoutes);
app.use('/api/recetas', recetaRoutes);
app.use('/api/vacunas', vacunaRoutes);
app.use('/api/antecedentes', antecedenteRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/med-recetados', medRecetadosRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/wearable', wearableRoutes);



app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: err.message
    });
});

// server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
})

