const express = require("express");
const router = express.Router();
const { uploadDocuments } = require("../config/cloudinary"); 
const controller = require("../controllers/documentController");
const verifyAndRenewToken = require("../middlewares/authMiddleware");

router.use(verifyAndRenewToken);

router.post("/upload", uploadDocuments.single("file"), controller.uploadDocument);
router.get("/patient/:id", controller.getByPatient);
router.delete("/:id", controller.deleteDocument);
router.get("/:id/view", controller.viewAndMarkAsRead);
router.get("/:id/read", controller.getReadDocuments);
router.get("/:id/pending", controller.getPendingDocuments);
router.get("/all/read", controller.getAllReadDocuments);

module.exports = router;
