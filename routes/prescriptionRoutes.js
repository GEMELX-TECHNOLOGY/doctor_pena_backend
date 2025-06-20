const express = require('express');
const router = express.Router();
const controller = require('../controllers/prescriptionController');
const verifyAndRenewToken = require('../middlewares/authMiddleware');

router.use(verifyAndRenewToken);

// Doctor only
router.post('/register', controller.createPrescription);
router.get('/consultation/:id', controller.getPrescriptionByConsultation); 
router.get('/consultation/:id/print', controller.getPrescriptionDataForPrinting); 

module.exports = router;