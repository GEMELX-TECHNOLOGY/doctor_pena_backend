const express = require('express');
const router = express.Router();
const citaController = require('../controllers/appointmentController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

router.post('/register', citaController.createAppointment);

// Solo doctor
router.get('/todas', citaController.getAllAppointments);

// Solo paciente
router.get('/paciente/:id', citaController.getAppointmentsByPatient);

// Solo el doctor puede actualizar
router.put('/update/:id', citaController.updateAppointment);
router.put('/update/:id/cancelar', citaController.cancelAppointment);
router.put('/update/:id/estado', citaController.updateAppointmentStatus);

// Nuevo endpoint para marcar cita completada (solo doctor)
router.put('/update/:id/completar', citaController.markAsCompleted);

module.exports = router;
