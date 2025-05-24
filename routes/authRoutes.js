const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');


//Registro en app y web
router.post('/register/web', authController.registerWeb);
router.post('/register/app', authController.registerApp);

// Login para ambos
router.post('/login', authController.login);

//usadas exclusivamente en la app movil
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

//refresh token
router.post('/refresh-token', authController.refreshToken);

module.exports = router;