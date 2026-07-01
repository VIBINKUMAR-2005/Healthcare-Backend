const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  deleteUser,
  toggleUserStatus,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/toggle', toggleUserStatus);

module.exports = router;
