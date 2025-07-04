const express = require("express");
const router = express.Router();
const controller = require("../controllers/authController");
const verifyAndRenewToken = require("../middlewares/authMiddleware");
const { uploadProfile } = require("../config/cloudinary");

// Web registration
router.post("/register/web", controller.registerWeb);
router.post("/login", controller.login);

// Mobile app only
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);
router.post(
	"/register/patient-app",
	uploadProfile.single("profile_picture"),
	controller.registerPatientApp,
);
router.put(
	"/patient/update-credentials",
	verifyAndRenewToken,
	controller.updatePatientCredentials,
);
router.delete(
	"/patient/deactivate-account",
	verifyAndRenewToken,
	controller.deactivatePatientAccount,
);

// Refresh token
router.post("/refresh-token", controller.refreshToken);
router.put(
	"/admin/update-credentials",
	verifyAndRenewToken,
	controller.updateAdminCredentials,
);

//get users: datos del paciente
router.get(
	"/patient/full-info",
	verifyAndRenewToken,
	controller.getPatientFullInfo,
);
module.exports = router;
