const express = require('express');
const router = express.Router();
const historialController = require('../controllers/historyController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

router.get('/paciente/:id', historialController.getHistoryByPatient);
router.get('/todos', historialController.getAllChanges);

module.exports = router; 
