const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

// Registrar paciente
router.post('/registrar', pacienteController.registrarPacienteWeb);

// Obtener todos
router.get('/obtener', pacienteController.obtenerTodos);

// Obtener por ID
router.get('/obtener/:id', pacienteController.obtenerPorId);

// Actualizar
router.put('/update/:id', pacienteController.actualizar);



module.exports = router;
