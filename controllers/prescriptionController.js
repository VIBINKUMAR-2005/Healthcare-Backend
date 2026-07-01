const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');

// ─── @route POST /api/prescriptions  (doctor) ────────────────────────────────
exports.createPrescription = async (req, res) => {
  try {
    const { appointment, patient, diagnosis, medicines, advice, followUpDate } = req.body;

    // Verify appointment belongs to this doctor
    const appt = await Appointment.findById(appointment);
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });

    if (appt.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check if prescription already exists for this appointment
    const existing = await Prescription.findOne({ appointment });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Prescription already exists for this appointment' });
    }

    const prescription = await Prescription.create({
      appointment,
      patient,
      doctor: req.user._id,
      diagnosis,
      medicines,
      advice,
      followUpDate,
    });

    await prescription.populate([
      { path: 'patient', select: 'name email' },
      { path: 'doctor', select: 'name email' },
      { path: 'appointment' },
    ]);

    res.status(201).json({ success: true, prescription });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @route GET /api/prescriptions/my  (patient) ─────────────────────────────
exports.getMyPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patient: req.user._id })
      .populate('doctor', 'name email')
      .populate('appointment', 'appointmentDate timeSlot')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: prescriptions.length, prescriptions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @route GET /api/prescriptions/doctor  (doctor) ──────────────────────────
exports.getDoctorPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctor: req.user._id })
      .populate('patient', 'name email phone')
      .populate('appointment', 'appointmentDate timeSlot')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: prescriptions.length, prescriptions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @route GET /api/prescriptions/:id ───────────────────────────────────────
exports.getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email')
      .populate('appointment');

    if (!prescription)
      return res.status(404).json({ success: false, message: 'Prescription not found' });

    const userId = req.user._id.toString();
    if (
      prescription.patient._id.toString() !== userId &&
      prescription.doctor._id.toString() !== userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, prescription });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
