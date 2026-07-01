const Patient = require('../models/Patient');
const User = require('../models/User');

// ─── @route GET /api/patients/profile ────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id }).populate('user', '-password');
    if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });
    res.json({ success: true, patient });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @route PUT /api/patients/profile ────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { dateOfBirth, gender, bloodGroup, address, emergencyContact, allergies } = req.body;

    const patient = await Patient.findOneAndUpdate(
      { user: req.user._id },
      { dateOfBirth, gender, bloodGroup, address, emergencyContact, allergies },
      { new: true, upsert: true }
    ).populate('user', '-password');

    res.json({ success: true, patient });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @route GET /api/patients/all  (admin only) ───────────────────────────────
exports.getAllPatients = async (req, res) => {
  try {
    const { search } = req.query;
    let userQuery = { role: 'patient' };

    if (search) {
      userQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(userQuery).select('-password');
    const patientIds = users.map((u) => u._id);
    const patients = await Patient.find({ user: { $in: patientIds } }).populate('user', '-password');

    res.json({ success: true, count: patients.length, patients });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
