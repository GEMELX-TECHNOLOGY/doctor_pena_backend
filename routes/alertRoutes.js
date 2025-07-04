const express = require("express");
const router = express.Router();
const controller = require("../controllers/alertController");
const verifyAndRenewToken = require("../middlewares/authMiddleware");

router.use(verifyAndRenewToken);

router.post("/", controller.createAlert);
router.get("/:recipient_id", controller.getByRecipient);
router.put("/:id/read", controller.markAsRead);

module.exports = router;
