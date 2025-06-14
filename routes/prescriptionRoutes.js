const express = require('express');
const router = express.Router();
const recetaController = require('../controllers/prescriptionController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

// Crear receta solo doctor
router.post('/register', recetaController.createPrescription);

// Ver receta por consulta doc y paciente
router.get('/obtener/consulta/:id', recetaController.getPrescriptionByConsultation);

// Obtener receta completa para impresión doc y paciente
router.get('/obtener/consulta/:id/imprimir', recetaController.getPrescriptionDataForPrinting);


module.exports = router;
