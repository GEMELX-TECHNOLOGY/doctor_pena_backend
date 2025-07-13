const express = require("express");
const router = express.Router();
const controller = require("../controllers/appointmentController");
const verifyAndRenewToken = require("../middlewares/authMiddleware");

router.use(verifyAndRenewToken);

router.post("/register", controller.createAppointment);
router.get("/all", controller.getAllAppointments);

// Cambiado de :id a :registration_number
router.get("/patient/:registration_number", controller.getAppointmentsByPatient);

// Para actualizar cita se mantiene por id de la cita, no paciente
router.put("/update/:id", controller.updateAppointment);
router.put("/update/:id/cancel", controller.cancelAppointment);
router.put("/update/:id/status", controller.updateAppointmentStatus);
router.put("/update/:id/complete", controller.markAsCompleted);

// Cambiado de :id a :registration_number
router.get("/next/patient/:registration_number", controller.getNextAppointmentByPatient);

router.get("/next/doctor", controller.getNextAppointmentByDoctor);

module.exports = router;
