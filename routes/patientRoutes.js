const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getAllPatients } = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/profile', protect, authorize('patient'), getProfile);
router.put('/profile', protect, authorize('patient'), updateProfile);
router.get('/all', protect, authorize('admin'), getAllPatients);

module.exports = router;
