const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const bcrypt = require('bcryptjs');

// ─── @route GET /api/doctors ──────────────────────────────────────────────────
exports.getAllDoctors = async (req, res) => {
  try {
    const { search, specialization } = req.query;

    let pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      { $match: { 'userInfo.isActive': true, isVerified: true } },
    ];

    if (specialization) {
      pipeline.push({ $match: { specialization: { $regex: specialization, $options: 'i' } } });
    }

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'userInfo.name': { $regex: search, $options: 'i' } },
            { specialization: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push({
      $project: {
        specialization: 1,
        qualification: 1,
        experience: 1,
        consultationFee: 1,
        rating: 1,
        bio: 1,
        totalConsultations: 1,
        availability: 1,
        'userInfo._id': 1,
        'userInfo.name': 1,
        'userInfo.email': 1,
        'userInfo.phone': 1,
      },
    });

    const doctors = await Doctor.aggregate(pipeline);
    res.json({ success: true, count: doctors.length, doctors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @route GET /api/doctors/:id ─────────────────────────────────────────────
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('user', '-password');
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @route GET /api/doctors/profile  (doctor auth) ──────────────────────────
exports.getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id }).populate('user', '-password');
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    res.json({ success: true, doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @route GET /api/doctors/stats  (doctor auth) ────────────────────────────
exports.getDoctorStats = async (req, res) => {
  try {
    const total = await Appointment.countDocuments({ doctor: req.user._id });
    const completed = await Appointment.countDocuments({ doctor: req.user._id, status: 'completed' });
    const pending = await Appointment.countDocuments({ doctor: req.user._id, status: 'pending' });
    const approved = await Appointment.countDocuments({ doctor: req.user._id, status: 'approved' });

    // Monthly stats for the current year
    const year = new Date().getFullYear();
    const monthly = await Appointment.aggregate([
      {
        $match: {
          doctor: req.user._id,
          status: 'completed',
          appointmentDate: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) },
        },
      },
      { $group: { _id: { $month: '$appointmentDate' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, stats: { total, completed, pending, approved, monthly } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @route POST /api/doctors  (admin creates doctor) ────────────────────────
exports.createDoctor = async (req, res) => {
  try {
    const {
      name, email, password, phone,
      specialization, qualification, experience,
      licenseNumber, consultationFee, bio, availability,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, phone, role: 'doctor' });
    const doctor = await Doctor.create({
      user: user._id,
      specialization,
      qualification,
      experience,
      licenseNumber,
      consultationFee,
      bio,
      availability,
      isVerified: true,
    });

    res.status(201).json({ success: true, doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @route DELETE /api/doctors/:id  (admin) ──────────────────────────────────
exports.deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    await User.findByIdAndUpdate(doctor.user, { isActive: false });
    res.json({ success: true, message: 'Doctor deactivated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @route GET /api/doctors/all-admin  (admin) ───────────────────────────────
exports.getAllDoctorsAdmin = async (req, res) => {
  try {
    const { search } = req.query;
    let matchStage = {};

    if (search) {
      const users = await User.find({
        role: 'doctor',
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      matchStage = { user: { $in: users.map((u) => u._id) } };
    }

    const doctors = await Doctor.find(matchStage).populate('user', '-password');
    res.json({ success: true, count: doctors.length, doctors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
