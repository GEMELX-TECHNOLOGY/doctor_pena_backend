const express = require('express');
const router = express.Router();
const medicoController = require('../controllers/doctorController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

// Solo el admin puede acceder a estas rutas
router.get('/obtener', medicoController.getAllDoctors);
router.get('/obtener/:id', medicoController.getDoctorById);
router.post('/create', medicoController.createDoctor);
router.put('/update/:id', medicoController.updateDoctor);
router.delete('/delete/:id', medicoController.deleteDoctor);

module.exports = router;
    