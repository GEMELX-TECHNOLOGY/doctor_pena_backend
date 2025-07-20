const express = require("express");
const router = express.Router();
const controller = require("../controllers/patientController");
const verifyAndRenewToken = require("../middlewares/authMiddleware");

router.use(verifyAndRenewToken);

router.post("/register", controller.registerPatientWeb);
router.get("/", controller.getAllPatients);
router.get("/:registration_number", controller.getPatientByRegistrationNumber);
router.put(
	"/update/:registration_number",
	controller.updatePatientByRegistrationNumber,
);
router.get("/medband/active", controller.getPatientsWithMedband);

module.exports = router;
