const express = require('express');
const router = express.Router();
const controller = require('../controllers/medicamentosRecetadosController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

router.post('/register', controller.agregarMedicamento);
router.get('/receta/:id', controller.obtenerPorReceta);
router.put('/update/:id', controller.actualizarMedicamento);
router.delete('/delete/:id', controller.eliminarMedicamento);

module.exports = router;
