const express = require("express");
const router = express.Router();
const controller = require("../controllers/vitalSignsController");
const verifyAndRenewToken = require("../middlewares/authMiddleware");

router.use(verifyAndRenewToken);

// Doctor only
router.post("/register", controller.createVitalSigns);
router.get("/consultation/:id", controller.getVitalSignsByConsultation);
router.put("/update/:consultation_id", controller.updateVitalSigns);

module.exports = router;
