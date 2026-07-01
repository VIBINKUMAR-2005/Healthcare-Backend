const express = require('express');
const router = express.Router();
const {
  getAllDoctors,
  getDoctorById,
  getDoctorProfile,
  getDoctorStats,
  createDoctor,
  deleteDoctor,
  getAllDoctorsAdmin,
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getAllDoctors);
router.get('/:id', getDoctorById);

// Doctor routes
router.get('/me/profile', protect, authorize('doctor'), getDoctorProfile);
router.get('/me/stats', protect, authorize('doctor'), getDoctorStats);

// Admin routes
router.post('/', protect, authorize('admin'), createDoctor);
router.get('/admin/all', protect, authorize('admin'), getAllDoctorsAdmin);
router.delete('/:id', protect, authorize('admin'), deleteDoctor);

module.exports = router;
