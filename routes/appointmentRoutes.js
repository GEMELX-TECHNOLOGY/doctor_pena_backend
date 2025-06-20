const express = require('express');
const router = express.Router();
const controller = require('../controllers/appointmentController');
const verifyAndRenewToken = require('../middlewares/authMiddleware');

router.use(verifyAndRenewToken);

router.post('/register', controller.createAppointment);
router.get('/all', controller.getAllAppointments); 
router.get('/patient/:id', controller.getAppointmentsByPatient); 
router.put('/update/:id', controller.updateAppointment);
router.put('/update/:id/cancel', controller.cancelAppointment); 
router.put('/update/:id/status', controller.updateAppointmentStatus); 
router.put('/update/:id/complete', controller.markAsCompleted); 

module.exports = router;