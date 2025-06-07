const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

// Crear venta
router.post('/register', ventaController.crearVenta);
// Ver todas las ventas
router.get('/obtener', ventaController.obtenerVentas);

// Ver una venta por ID
router.get('/obtener/:id', ventaController.obtenerVentaPorId);

// Actualizar venta
router.put('/update/:id', ventaController.actualizarVenta);

// Eliminar venta
router.delete('/delete/:id', ventaController.eliminarVenta);


module.exports = router;
