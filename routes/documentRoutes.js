const express = require('express');
const router = express.Router();
const controller = require('../controllers/documentController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

router.post('/subir', controller.uploadDocument);
router.get('/paciente/:id', controller.getByPatient);
router.delete('/:id', controller.deleteDocument);
router.get('/:id/ver', controller.viewAndMarkAsRead);


module.exports = router;
