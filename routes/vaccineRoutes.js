const express = require('express');
const router = express.Router();
const vaccineController = require('../controllers/vaccineController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

router.post('/register', vaccineController.registerVaccine);
router.get('/paciente/:id', vaccineController.getVaccinesByPatient);
router.put('/update/:id', vaccineController.updateVaccine);
router.delete('/delete/:id', vaccineController.deleteVaccine);

module.exports = router;
