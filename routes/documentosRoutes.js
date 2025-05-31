const express = require('express');
const router = express.Router();
const controller = require('../controllers/documentosController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

router.post('/subir', controller.subirDocumento);
router.get('/paciente/:id', controller.obtenerPorPaciente);
router.delete('/:id', controller.eliminarDocumento);

module.exports = router;
