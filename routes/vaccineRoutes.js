const express = require('express');
const router = express.Router();
const controller = require('../controllers/vaccineController');
const verifyAndRenewToken = require('../middlewares/authMiddleware');

router.use(verifyAndRenewToken);

router.post('/register', controller.registerVaccine);
router.get('/patient/:id', controller.getVaccinesByPatient); 
router.put('/update/:id', controller.updateVaccine);
router.delete('/delete/:id', controller.deleteVaccine);

module.exports = router;