const express = require('express');
const router = express.Router();
const citaController = require('../controllers/citaController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

router.post('/register', citaController.crearCita);

// Solo doctor
router.get('/todas', citaController.verTodasLasCitas);

// Solo paciente
router.get('/paciente/:id', citaController.verCitasPorPaciente);

// Solo el doctor puede actualizar
router.put('/update/:id', citaController.actualizarCita);
router.put('/update/:id/cancelar', citaController.cancelarCita);
router.put('/update/:id/estado', citaController.actualizarEstadoCita);

// Nuevo endpoint para marcar cita completada (solo doctor)
router.put('/update/:id/completar', citaController.marcarEstadoFinalCompletada);

module.exports = router;
