const express = require('express');
const router = express.Router();
const antecedenteController = require('../controllers/familyHistoryController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

router.post('/register', antecedenteController.createFamilyHistory);
router.get('/paciente/:id', antecedenteController.getByPatient);
router.put('/update/:id', antecedenteController.updateFamilyHistory);
router.delete('/delete/:id', antecedenteController.deleteFamilyHistory);

module.exports = router;
