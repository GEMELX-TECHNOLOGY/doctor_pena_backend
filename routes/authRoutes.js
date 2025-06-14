const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');


//Registro en web
router.post('/register/web', authController.registerWeb);


// Login para ambos
router.post('/login', authController.login);

//usadas exclusivamente en la app movil
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/registro-paciente-app', authController.registerPatientApp);
// Ruta para actualizar correo y contraseña paciente (requiere token)
router.put('/paciente/actualizar-credenciales', verificarYRenovarToken, authController.updatePatientCredentials);
router.delete('/paciente/eliminar-cuenta', verificarYRenovarToken, authController.deactivatePatientAccount);

//refresh token
router.post('/refresh-token', authController.refreshToken);
// Solo admin puede modificar sus datos de acceso
router.put('/admin/actualizar-credenciales', verificarYRenovarToken, authController.updateAdminCredentials);

module.exports = router;