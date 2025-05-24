
const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');

// Registrar paciente
router.post('/registrar', pacienteController.registrarPacienteWeb);

// Obtener todos
router.get('/obtener', pacienteController.obtenerTodos);

// Obtener por ID
router.get('/obtener/:id', pacienteController.obtenerPorId);

// Actualizar
router.put('/update/:id', pacienteController.actualizar);

// Eliminar
router.delete('/delete/:id', pacienteController.eliminar);

module.exports = router;
