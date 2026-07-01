const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },     // e.g. "500mg"
  frequency: { type: String, required: true },  // e.g. "Twice a day"
  duration: { type: String, required: true },   // e.g. "7 days"
  instructions: { type: String },               // e.g. "After meals"
});

const PrescriptionSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    diagnosis: { type: String, required: true },
    medicines: [MedicineSchema],
    advice: { type: String },       // general advice
    followUpDate: { type: Date },
    issuedDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prescription', PrescriptionSchema);
