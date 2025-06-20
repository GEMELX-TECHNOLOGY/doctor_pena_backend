const express = require('express');
const router = express.Router();
const controller = require('../controllers/patientController');
const verifyAndRenewToken = require('../middlewares/authMiddleware');

router.use(verifyAndRenewToken);

router.post('/register', controller.registerPatientWeb); 
router.get('/', controller.getAllPatients);
router.get('/:id', controller.getPatientById);
router.put('/update/:id', controller.updatePatient);

module.exports = router;