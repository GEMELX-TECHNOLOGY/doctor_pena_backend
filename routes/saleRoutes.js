const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/saleController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

// Crear venta
router.post('/register', ventaController.createSale);
// Ver todas las ventas
router.get('/obtener', ventaController.getAllSales);

// Ver una venta por ID
router.get('/obtener/:id', ventaController.getSaleById);

// Actualizar venta
router.put('/update/:id', ventaController.updateSale);

// Eliminar venta
router.delete('/delete/:id', ventaController.deleteSale);

router.get('/totales/mensuales', ventaController.getMonthlyTotals);


module.exports = router;
