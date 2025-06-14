const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/patientController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

// Registrar paciente
router.post('/registrar', pacienteController.registerPatientWeb);

// Obtener todos
router.get('/obtener', pacienteController.getAllPatients);

// Obtener por ID
router.get('/obtener/:id', pacienteController.getPatientById);

// Actualizar
router.put('/update/:id', pacienteController.updatePatient);



module.exports = router;
