const express = require('express');
const router = express.Router();
const citaController = require('../controllers/citaController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);


router.post('/register', citaController.crearCita);
//solo doctor
router.get('/todas', citaController.verTodasLasCitas);

//solo paciente
router.get('/// solo doctorpaciente/:id', citaController.verCitasPorPaciente);
//solo el doctor puede actualizar
router.put('/update/:id', citaController.actualizarCita);
router.put('/update/:id/cancelar', citaController.cancelarCita);

module.exports = router;
