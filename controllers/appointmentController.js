const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// ─── @route POST /api/appointments  (patient) ────────────────────────────────
exports.bookAppointment = async (req, res) => {
  try {
    const { doctor, appointmentDate, timeSlot, symptoms, notes, consultationType } = req.body;

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor,
      appointmentDate,
      timeSlot,
      symptoms,
      notes,
      consultationType,
    });

    await appointment.populate([
      { path: 'patient', select: 'name email phone' },
      { path: 'doctor', select: 'name email' },
    ]);

    res.status(201).json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @route GET /api/appointments/my  (patient) ──────────────────────────────
exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('doctor', 'name email')
      .sort({ appointmentDate: -1 });

    res.json({ success: true, count: appointments.length, appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @route GET /api/appointments/doctor  (doctor) ───────────────────────────
exports.getDoctorAppointments = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { doctor: req.user._id };
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name email phone')
      .sort({ appointmentDate: 1 });

    res.json({ success: true, count: appointments.length, appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @route GET /api/appointments/:id ────────────────────────────────────────
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email');

    if (!appointment)
      return res.status(404).json({ success: false, message: 'Appointment not found' });

    // Only patient, doctor of this appointment, or admin can view
    const userId = req.user._id.toString();
    if (
      appointment.patient._id.toString() !== userId &&
      appointment.doctor._id.toString() !== userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @route PUT /api/appointments/:id/status  (doctor/admin) ─────────────────
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status, diagnosis } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment)
      return res.status(404).json({ success: false, message: 'Appointment not found' });

    // Doctors can only update their own appointments
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    appointment.status = status;
    if (diagnosis) appointment.diagnosis = diagnosis;
    await appointment.save();

    // If completed, increment doctor's consultation count
    if (status === 'completed') {
      await Doctor.findOneAndUpdate({ user: appointment.doctor }, { $inc: { totalConsultations: 1 } });
    }

    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @route GET /api/appointments/all  (admin) ───────────────────────────────
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('patient', 'name email')
      .populate('doctor', 'name email')
      .sort({ appointmentDate: -1 });

    res.json({ success: true, count: appointments.length, appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @route DELETE /api/appointments/:id  (patient cancels) ──────────────────
exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment)
      return res.status(404).json({ success: false, message: 'Appointment not found' });

    if (appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    appointment.status = 'cancelled';
    await appointment.save();
    res.json({ success: true, message: 'Appointment cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
