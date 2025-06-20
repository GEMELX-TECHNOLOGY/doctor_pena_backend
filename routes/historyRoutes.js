const express = require('express');
const router = express.Router();
const controller = require('../controllers/historyController');
const verifyAndRenewToken = require('../middlewares/authMiddleware');

router.use(verifyAndRenewToken);

router.get('/patient/:id', controller.getHistoryByPatient); 
router.get('/all', controller.getAllChanges);

module.exports = router;