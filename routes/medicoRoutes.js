const express = require('express');
const router = express.Router();
const medicoController = require('../controllers/medicoController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

// Solo el admin puede acceder a estas rutas
router.get('/obtener', medicoController.obtenerMedicos);
router.get('/obtener/:id', medicoController.obtenerMedicoPorId);
router.post('/create', medicoController.crearMedico);
router.put('/update/:id', medicoController.actualizarMedico);
router.delete('/delete/:id', medicoController.eliminarMedico);

module.exports = router;
