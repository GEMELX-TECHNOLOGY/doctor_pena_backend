const express = require('express');
const router = express.Router();
const signosController = require('../controllers/signosController');
const verificarYRenovarToken = require('../middlewares/authMiddleware');

router.use(verificarYRenovarToken);

// Crear, ver y actualizar signos vitales (solo doctor)
router.post('/register', signosController.crearSignos);
router.get('/obtener/:consulta_id', signosController.verSignosPorConsulta);
router.put('/update/:consulta_id', signosController.actualizarSignos);

module.exports = router;
