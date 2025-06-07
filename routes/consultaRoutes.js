
const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/consultaController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

//  para el doctor web
router.post('/register', consultaController.crearConsulta);
router.get('/obtener', consultaController.obtenerConsultas);
router.get('/obtener/:id', consultaController.obtenerConsultaPorId);
router.put('/pagar/:id', consultaController.marcarComoPagada);


// Para el paciente app movil
router.get('/paciente/:id', consultaController.consultasPorPaciente);

module.exports = router;
