const express = require('express');
const router = express.Router();
const antecedenteController = require('../controllers/antecedenteController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

router.post('/register', antecedenteController.crearAntecedente);
router.get('/paciente/:id', antecedenteController.obtenerAntecedentesPorPaciente);
router.put('/update/:id', antecedenteController.actualizarAntecedente);
router.delete('/delete/:id', antecedenteController.eliminarAntecedente);

module.exports = router;
