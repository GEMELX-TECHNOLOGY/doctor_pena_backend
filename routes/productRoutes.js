const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

router.post('/register', productosController.createProduct);
router.get('/', productosController.getAllProducts);
router.get('/:id', productosController.getProductById);
router.put('/update/:id', productosController.updateProduct);
router.delete('/delete/:id', productosController.deleteProduct);

module.exports = router;
