
const express = require("express");
const router = express.Router();
const controller = require("../controllers/consultationController");
const verifyAndRenewToken = require("../middlewares/authMiddleware");

router.use(verifyAndRenewToken);

// Para web doctor
router.post("/register", controller.createConsultation);
router.get("/", controller.getAllConsultations);
router.get("/:id", controller.getConsultationById);
router.put("/:id/pay", controller.markAsPaid);

// Para app del paciente (cambiado a registration_number)
router.get("/patient/by-registration/:registration_number", controller.getConsultationsByPatient);

module.exports = router;
