const express = require('express');
const router = express.Router();
const historialController = require('../controllers/historialController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

router.get('/paciente/:id', historialController.obtenerHistorialPorPaciente);
router.get('/todos', historialController.obtenerTodosLosCambios);

module.exports = router; 
