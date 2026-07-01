const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialization: { type: String, required: true },
    qualification: { type: String, required: true },
    experience: { type: Number, default: 0 }, // in years
    licenseNumber: { type: String, required: true, unique: true },
    consultationFee: { type: Number, default: 0 },
    availability: [
      {
        day: { type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
        startTime: String, // e.g. "09:00"
        endTime: String,   // e.g. "17:00"
      },
    ],
    bio: { type: String },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalConsultations: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', DoctorSchema);
