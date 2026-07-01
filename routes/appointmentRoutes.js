const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  getAllAppointments,
  cancelAppointment,
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('patient'), bookAppointment);
router.get('/my', protect, authorize('patient'), getMyAppointments);
router.get('/doctor', protect, authorize('doctor'), getDoctorAppointments);
router.get('/all', protect, authorize('admin'), getAllAppointments);
router.get('/:id', protect, getAppointmentById);
router.put('/:id/status', protect, authorize('doctor', 'admin'), updateAppointmentStatus);
router.put('/:id/cancel', protect, authorize('patient'), cancelAppointment);

module.exports = router;
