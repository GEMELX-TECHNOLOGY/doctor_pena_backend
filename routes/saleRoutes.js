const express = require("express");
const router = express.Router();
const controller = require("../controllers/saleController");
const verifyAndRenewToken = require("../middlewares/authMiddleware");

router.use(verifyAndRenewToken);

router.post("/register", controller.createSale);
router.get("/", controller.getAllSales);
router.get("/:id", controller.getSaleById);
router.put("/update/:id", controller.updateSale);
router.delete("/delete/:id", controller.deleteSale);
router.get("/totals/monthly", controller.getMonthlyTotals);

module.exports = router;
