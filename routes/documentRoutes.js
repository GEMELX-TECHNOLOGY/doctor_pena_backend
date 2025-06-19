const express = require('express');
const router = express.Router();
const controller = require('../controllers/documentController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

router.post('/subir', controller.uploadDocument);
router.get('/paciente/:id', controller.getByPatient);
router.delete('/:id', controller.deleteDocument);
router.get('/:id/ver', controller.viewAndMarkAsRead);
//por id
router.get('/leidos/:id', controller.getReadDocuments);
router.get('/pendientes/:id', controller.getPendingDocuments);
//general
router.get('/leidos', controller.getAllReadDocuments);
router.get('/pendientes', controller.getAllPendingDocuments);


module.exports = router;
