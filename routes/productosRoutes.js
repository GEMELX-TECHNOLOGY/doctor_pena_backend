const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

router.post('/register', productosController.crearProducto);
router.get('/', productosController.obtenerTodos);
router.get('/:id', productosController.obtenerPorId);
router.put('/update/:id', productosController.actualizar);
router.delete('/delete/:id', productosController.eliminar);

module.exports = router;
