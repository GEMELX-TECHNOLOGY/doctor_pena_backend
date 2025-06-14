
const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/consultationController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

//  para el doctor web
router.post('/register', consultaController.createConsultation);
router.get('/obtener', consultaController.getAllConsultations);
router.get('/obtener/:id', consultaController.getConsultationById);
router.put('/pagar/:id', consultaController.markAsPaid);


// Para el paciente app movil
router.get('/paciente/:id', consultaController.getConsultationsByPatient);

module.exports = router;
