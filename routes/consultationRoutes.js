const express = require("express");
const router = express.Router();
const controller = require("../controllers/consultationController");
const verifyAndRenewToken = require("../middlewares/authMiddleware");

router.use(verifyAndRenewToken);

// For web doctor
router.post("/register", controller.createConsultation);
router.get("/", controller.getAllConsultations);
router.get("/:id", controller.getConsultationById);
router.put("/:id/pay", controller.markAsPaid);

// For mobile patient
router.get("/patient/:id", controller.getConsultationsByPatient);

module.exports = router;
