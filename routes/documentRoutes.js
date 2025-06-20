const express = require('express');
const router = express.Router();
const controller = require('../controllers/documentController');
const verifyAndRenewToken = require('../middlewares/authMiddleware');

router.use(verifyAndRenewToken);

router.post('/upload', controller.uploadDocument);
router.get('/patient/:id', controller.getByPatient); 
router.delete('/:id', controller.deleteDocument);
router.get('/:id/view', controller.viewAndMarkAsRead); 
router.get('/:id/read', controller.getReadDocuments); 
router.get('/:id/pending', controller.getPendingDocuments); 
router.get('/all/read', controller.getAllReadDocuments);
router.get('/all/pending', controller.getAllPendingDocuments); 

module.exports = router;