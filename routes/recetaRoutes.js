const express = require('express');
const router = express.Router();
const recetaController = require('../controllers/recetaController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

// Crear receta solo doctor
router.post('/register', recetaController.crearReceta);

// Ver receta por consulta doc y paciente
router.get('/obtener/consulta/:id', recetaController.verRecetaPorConsulta);

// Obtener receta completa para impresión doc y paciente
router.get('/obtener/consulta/:id/imprimir', recetaController.obtenerDatosRecetaParaImpresion);

module.exports = router;
