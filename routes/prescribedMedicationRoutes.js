const express = require('express');
const router = express.Router();
const controller = require('../controllers/prescribedMedicationController');
const verifyAndRenewToken = require('../middlewares/authMiddleware');

router.use(verifyAndRenewToken);

router.post('/register', controller.addPrescribedMedication);
router.get('/prescription/:id', controller.getByPrescription); 
router.put('/update/:id', controller.updatePrescribedMedication);
router.delete('/delete/:id', controller.deletePrescribedMedication);

module.exports = router;