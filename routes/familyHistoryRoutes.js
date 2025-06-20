const express = require('express');
const router = express.Router();
const controller = require('../controllers/familyHistoryController');
const verifyAndRenewToken = require('../middlewares/authMiddleware');

router.use(verifyAndRenewToken);

router.post('/register', controller.createFamilyHistory);
router.get('/patient/:id', controller.getByPatient); 
router.put('/update/:id', controller.updateFamilyHistory);
router.delete('/delete/:id', controller.deleteFamilyHistory);

module.exports = router;