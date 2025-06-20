const express = require('express');
const router = express.Router();
const controller = require('../controllers/doctorController');
const verifyAndRenewToken = require('../middlewares/authMiddleware');

router.use(verifyAndRenewToken);

// Admin only
router.get('/', controller.getAllDoctors); 
router.get('/:id', controller.getDoctorById); 
router.post('/create', controller.createDoctor);
router.put('/update/:id', controller.updateDoctor);
router.delete('/delete/:id', controller.deleteDoctor);

module.exports = router;