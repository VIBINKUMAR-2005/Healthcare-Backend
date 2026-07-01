const mongoose = require('mongoose');

const SymptomCheckSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    symptoms: [{ type: String }],
    results: [
      {
        disease: String,
        confidence: Number, // percentage 0-100
        description: String,
      },
    ],
    checkedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SymptomCheck', SymptomCheckSchema);
