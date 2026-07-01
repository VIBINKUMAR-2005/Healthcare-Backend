const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const SymptomCheck = require('../models/SymptomCheck');

// ─── @route GET /api/admin/stats ─────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const totalPatients = await User.countDocuments({ role: 'patient', isActive: true });
    const totalDoctors = await User.countDocuments({ role: 'doctor', isActive: true });
    const totalConsultations = await Appointment.countDocuments({ status: 'completed' });
    const totalAppointments = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });

    // Monthly consultations for the current year
    const year = new Date().getFullYear();
    const monthlyConsultations = await Appointment.aggregate([
      {
        $match: {
          status: 'completed',
          appointmentDate: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) },
        },
      },
      { $group: { _id: { $month: '$appointmentDate' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Disease trends from symptom checks
    const diseaseTrends = await SymptomCheck.aggregate([
      { $unwind: '$results' },
      { $group: { _id: '$results.disease', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      stats: {
        totalPatients,
        totalDoctors,
        totalConsultations,
        totalAppointments,
        pendingAppointments,
        monthlyConsultations,
        diseaseTrends,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @route GET /api/admin/users ─────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role } = req.query;
    let query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @route DELETE /api/admin/users/:id ──────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete admin account' });
    }

    // Soft delete
    user.isActive = false;
    await user.save();

    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @route PUT /api/admin/users/:id/activate ────────────────────────────────
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
