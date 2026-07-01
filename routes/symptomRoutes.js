const express = require('express');
const router = express.Router();
const { checkSymptoms, getSymptomsList, getSymptomHistory } = require('../controllers/symptomController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/list', getSymptomsList);
router.post('/check', protect, authorize('patient'), checkSymptoms);
router.get('/history', protect, authorize('patient'), getSymptomHistory);

module.exports = router;
