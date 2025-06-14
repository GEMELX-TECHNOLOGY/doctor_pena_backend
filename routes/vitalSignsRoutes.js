const express = require('express');
const router = express.Router();
const signosController = require('../controllers/vitalSignsController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

// Crear, ver y actualizar signos vitales (solo doctor)
router.post('/register', signosController.createVitalSigns);
router.get('/obtener/:consulta_id', signosController.getVitalSignsByConsultation);
router.put('/update/:consulta_id', signosController.updateVitalSigns);

module.exports = router;
