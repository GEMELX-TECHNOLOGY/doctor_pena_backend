const express = require('express');
const router = express.Router();
const controller = require('../controllers/alertController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

router.post('/', controller.createAlert);
router.get('/:destinatario_id', controller.getByRecipient);
router.put('/:id/leida', controller.markAsRead);

module.exports = router;
