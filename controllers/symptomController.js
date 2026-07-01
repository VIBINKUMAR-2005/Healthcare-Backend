const SymptomCheck = require('../models/SymptomCheck');

// ─── Symptom-to-Disease Mapping Database ─────────────────────────────────────
const DISEASE_MAP = [
  {
    disease: 'Influenza (Flu)',
    symptoms: ['fever', 'cough', 'body ache', 'fatigue', 'chills'],
    confidence: 85,
    description: 'A contagious respiratory illness caused by influenza viruses. Rest and fluids recommended.',
  },
  {
    disease: 'Viral Fever',
    symptoms: ['fever', 'headache', 'body ache', 'fatigue', 'loss of appetite'],
    confidence: 80,
    description: 'A fever caused by a viral infection. Usually resolves with rest and hydration.',
  },
  {
    disease: 'Common Cold',
    symptoms: ['sneezing', 'runny nose', 'sore throat', 'mild cough', 'nasal congestion'],
    confidence: 90,
    description: 'A mild viral infection of the upper respiratory tract. Usually clears within 7-10 days.',
  },
  {
    disease: 'Food Poisoning',
    symptoms: ['stomach pain', 'vomiting', 'diarrhea', 'nausea', 'fever'],
    confidence: 75,
    description: 'Caused by consuming contaminated food. Stay hydrated and seek medical help if severe.',
  },
  {
    disease: 'Dengue Fever',
    symptoms: ['high fever', 'severe headache', 'joint pain', 'rash', 'nausea', 'fatigue'],
    confidence: 80,
    description: 'A mosquito-borne viral disease. Requires medical attention; avoid aspirin.',
  },
  {
    disease: 'Malaria',
    symptoms: ['high fever', 'chills', 'sweating', 'headache', 'nausea', 'fatigue'],
    confidence: 78,
    description: 'A life-threatening disease spread by mosquito bites. Requires immediate medical treatment.',
  },
  {
    disease: 'Typhoid',
    symptoms: ['prolonged fever', 'weakness', 'stomach pain', 'headache', 'loss of appetite', 'constipation'],
    confidence: 75,
    description: 'A bacterial infection spread through contaminated food/water. Requires antibiotic treatment.',
  },
  {
    disease: 'Pneumonia',
    symptoms: ['high fever', 'severe cough', 'chest pain', 'shortness of breath', 'fatigue'],
    confidence: 80,
    description: 'A lung infection that can be serious. Requires medical evaluation and possibly antibiotics.',
  },
  {
    disease: 'Gastroenteritis',
    symptoms: ['stomach pain', 'diarrhea', 'nausea', 'vomiting', 'bloating'],
    confidence: 82,
    description: 'Inflammation of the stomach and intestines. Stay hydrated; usually self-limiting.',
  },
  {
    disease: 'Migraine',
    symptoms: ['severe headache', 'nausea', 'sensitivity to light', 'sensitivity to sound', 'vomiting'],
    confidence: 85,
    description: 'A neurological condition causing intense headaches. Avoid triggers and rest in a dark room.',
  },
  {
    disease: 'Hypertension',
    symptoms: ['headache', 'dizziness', 'blurred vision', 'shortness of breath', 'chest pain'],
    confidence: 70,
    description: 'High blood pressure. Requires lifestyle changes and possibly medication.',
  },
  {
    disease: 'Diabetes (Type 2)',
    symptoms: ['frequent urination', 'excessive thirst', 'fatigue', 'blurred vision', 'slow healing wounds'],
    confidence: 72,
    description: 'A chronic condition affecting blood sugar. Requires diet management and medical supervision.',
  },
  {
    disease: 'Asthma',
    symptoms: ['shortness of breath', 'wheezing', 'chest tightness', 'cough', 'difficulty breathing'],
    confidence: 83,
    description: 'A respiratory condition causing airway inflammation. Requires inhaler and trigger avoidance.',
  },
  {
    disease: 'Urinary Tract Infection (UTI)',
    symptoms: ['frequent urination', 'burning urination', 'lower abdominal pain', 'cloudy urine', 'fever'],
    confidence: 85,
    description: 'A bacterial infection in the urinary system. Requires antibiotic treatment.',
  },
  {
    disease: 'Anemia',
    symptoms: ['fatigue', 'weakness', 'pale skin', 'shortness of breath', 'dizziness', 'cold hands'],
    confidence: 75,
    description: 'Low red blood cell count. May require iron supplements and dietary changes.',
  },
];

// ─── Symptom Matching Algorithm ───────────────────────────────────────────────
const matchSymptoms = (userSymptoms) => {
  const normalized = userSymptoms.map((s) => s.toLowerCase().trim());

  const results = DISEASE_MAP.map((entry) => {
    const matched = entry.symptoms.filter((s) => normalized.includes(s.toLowerCase()));
    if (matched.length === 0) return null;

    // Jaccard similarity-based confidence adjustment
    const union = new Set([...normalized, ...entry.symptoms.map((s) => s.toLowerCase())]);
    const jaccard = matched.length / union.size;
    const adjustedConfidence = Math.round(entry.confidence * (0.5 + 0.5 * jaccard));

    return {
      disease: entry.disease,
      confidence: Math.min(adjustedConfidence, 95), // cap at 95%
      matchedSymptoms: matched,
      description: entry.description,
    };
  })
    .filter(Boolean)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5); // top 5

  return results;
};

// ─── @route POST /api/symptoms/check ─────────────────────────────────────────
exports.checkSymptoms = async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one symptom' });
    }

    const results = matchSymptoms(symptoms);

    // Save to database
    const record = await SymptomCheck.create({
      patient: req.user._id,
      symptoms,
      results,
    });

    res.json({ success: true, results, checkId: record._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── @route GET /api/symptoms/list ───────────────────────────────────────────
exports.getSymptomsList = async (req, res) => {
  const allSymptoms = [
    ...new Set(DISEASE_MAP.flatMap((d) => d.symptoms)),
  ].sort();
  res.json({ success: true, symptoms: allSymptoms });
};

// ─── @route GET /api/symptoms/history  (patient) ─────────────────────────────
exports.getSymptomHistory = async (req, res) => {
  try {
    const history = await SymptomCheck.find({ patient: req.user._id }).sort({ checkedAt: -1 }).limit(10);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
