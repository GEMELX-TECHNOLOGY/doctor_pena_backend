const express = require('express');
const router = express.Router();
const vacunasController = require('../controllers/vacunasController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

router.post('/register', vacunasController.registrarVacuna);
router.get('/paciente/:id', vacunasController.obtenerVacunasPorPaciente);
router.put('/update/:id', vacunasController.actualizarVacuna);
router.delete('/delete/:id', vacunasController.eliminarVacuna);

module.exports = router;
