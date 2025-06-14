const express = require('express');
const router = express.Router();
const controller = require('../controllers/prescribedMedicationController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

router.post('/register', controller.addPrescribedMedication);
router.get('/receta/:id', controller.getByPrescription);
router.put('/update/:id', controller.updatePrescribedMedication);
router.delete('/delete/:id', controller.deletePrescribedMedication);

module.exports = router;
