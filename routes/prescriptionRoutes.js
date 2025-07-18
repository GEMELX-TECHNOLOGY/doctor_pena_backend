const express = require("express");
const router = express.Router();
const { uploadDocuments } = require("../config/cloudinary"); 
const prescriptionController = require("../controllers/prescriptionController");
const verificarYRenovarToken = require("../middlewares/authMiddleware");  

router.post(
  "/",
  verificarYRenovarToken,
  uploadDocuments.single("pdf"),  
  prescriptionController.createPrescription
);

module.exports = router;
