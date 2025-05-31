const express = require('express');
const router = express.Router();
const controller = require('../controllers/alertasController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

router.post('/', controller.crearAlerta);
router.get('/:destinatario_id', controller.obtenerPorDestinatario);
router.put('/:id/leida', controller.marcarComoLeida);

module.exports = router;
