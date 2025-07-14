const express = require("express");
const router = express.Router();
const { uploadDocuments } = require("../config/cloudinary"); 
const controller = require("../controllers/documentController");
const verificarYRenovarToken = require("../middlewares/authMiddleware");  

router.post("/upload", verificarYRenovarToken, uploadDocuments.single("file"), controller.uploadDocument);
router.get("/patient/:registration_number", controller.getByPatient);
router.delete("/:id", controller.deleteDocument); //id documento
router.get("/:id/view", controller.viewAndMarkAsRead); // Ver documento por id
router.get("/:registration_number/read", controller.getReadDocuments);
router.get("/:registration_number/pending", controller.getPendingDocuments);
router.get("/all/read", controller.getAllReadDocuments);

module.exports = router;
