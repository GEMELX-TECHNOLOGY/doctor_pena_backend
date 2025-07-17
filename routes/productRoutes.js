const express = require("express");
const router = express.Router();
const controller = require("../controllers/productController");
const verifyAndRenewToken = require("../middlewares/authMiddleware");
const { uploadProductImage } = require("../config/cloudinary");

router.use(verifyAndRenewToken);

router.post("/register", uploadProductImage.single("image"), controller.createProduct);

router.get("/", controller.getAllProducts);
router.get("/:id", controller.getProductById);
router.put("/update/:id", controller.updateProduct);
router.delete("/delete/:id", controller.deleteProduct);


module.exports = router;
