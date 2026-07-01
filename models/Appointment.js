const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appointmentDate: { type: Date, required: true },
    timeSlot: { type: String, required: true }, // e.g. "10:00 AM"
    status: {
      type: String,
      enum: ['pending', 'approved', 'completed', 'cancelled'],
      default: 'pending',
    },
    symptoms: [String],
    notes: { type: String },        // patient's notes
    diagnosis: { type: String },    // doctor fills this
    followUpDate: { type: Date },
    consultationType: {
      type: String,
      enum: ['video', 'chat', 'in-person'],
      default: 'video',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', AppointmentSchema);
