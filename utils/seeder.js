const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');

// Load .env from backend root (where the script is run from via npm run seed)
dotenv.config();

const seed = async () => {
  const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined. Check your .env file.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB Atlas');

  // ─── Clear existing data ──────────────────────────────────────────────────
  await Promise.all([
    User.deleteMany(),
    Doctor.deleteMany(),
    Patient.deleteMany(),
    Appointment.deleteMany(),
    Prescription.deleteMany(),
  ]);
  console.log('🗑️  Cleared existing data');

  // ─── Create Admin ─────────────────────────────────────────────────────────
  await User.create({
    name: 'Admin User',
    email: 'admin@telemedicine.com',
    password: 'admin123',
    role: 'admin',
    phone: '9000000001',
    isActive: true,
  });
  console.log('👤 Admin created');

  // ─── Create Doctors ───────────────────────────────────────────────────────
  const doctorData = [
    {
      name: 'Dr. Priya Sharma',
      email: 'priya.sharma@telemedicine.com',
      password: 'doctor123',
      phone: '9000000002',
      specialization: 'General Physician',
      qualification: 'MBBS, MD',
      experience: 10,
      licenseNumber: 'MH-GP-12345',
      consultationFee: 300,
      bio: 'Expert in general medicine with 10+ years of experience serving rural communities.',
      availability: [
        { day: 'Mon', startTime: '09:00', endTime: '13:00' },
        { day: 'Wed', startTime: '09:00', endTime: '13:00' },
        { day: 'Fri', startTime: '14:00', endTime: '18:00' },
      ],
    },
    {
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh.kumar@telemedicine.com',
      password: 'doctor123',
      phone: '9000000003',
      specialization: 'Pediatrics',
      qualification: 'MBBS, DCH',
      experience: 8,
      licenseNumber: 'UP-PD-67890',
      consultationFee: 400,
      bio: 'Specialized in child healthcare with a focus on preventive care and rural health education.',
      availability: [
        { day: 'Tue', startTime: '10:00', endTime: '14:00' },
        { day: 'Thu', startTime: '10:00', endTime: '14:00' },
        { day: 'Sat', startTime: '09:00', endTime: '12:00' },
      ],
    },
    {
      name: 'Dr. Anjali Singh',
      email: 'anjali.singh@telemedicine.com',
      password: 'doctor123',
      phone: '9000000004',
      specialization: 'Gynecology',
      qualification: 'MBBS, MS (OBG)',
      experience: 12,
      licenseNumber: 'MP-GY-11223',
      consultationFee: 500,
      bio: "Dedicated women's health specialist with expertise in rural maternal healthcare.",
      availability: [
        { day: 'Mon', startTime: '14:00', endTime: '18:00' },
        { day: 'Wed', startTime: '14:00', endTime: '18:00' },
        { day: 'Fri', startTime: '09:00', endTime: '13:00' },
      ],
    },
    {
      name: 'Dr. Anil Verma',
      email: 'anil.verma@telemedicine.com',
      password: 'doctor123',
      phone: '9000000005',
      specialization: 'Dermatology',
      qualification: 'MBBS, DVD',
      experience: 6,
      licenseNumber: 'RJ-DM-33445',
      consultationFee: 350,
      bio: 'Specialist in skin conditions with experience in tropical dermatology.',
      availability: [
        { day: 'Tue', startTime: '14:00', endTime: '18:00' },
        { day: 'Thu', startTime: '14:00', endTime: '18:00' },
      ],
    },
  ];

  const doctorUsers = [];
  for (const d of doctorData) {
    const { name, email, password, phone, ...docFields } = d;
    const user = await User.create({ name, email, password, phone, role: 'doctor', isActive: true });
    const doctor = await Doctor.create({ user: user._id, ...docFields, isVerified: true });
    doctorUsers.push({ user, doctor });
  }
  console.log(`👨‍⚕️  ${doctorData.length} doctors created`);

  // ─── Create Patients ──────────────────────────────────────────────────────
  const patientData = [
    {
      name: 'Ramesh Patel',
      email: 'ramesh.patel@email.com',
      password: 'patient123',
      phone: '9111111111',
      dateOfBirth: new Date('1985-06-15'),
      gender: 'male',
      bloodGroup: 'B+',
      address: { street: '12 Village Road', city: 'Bhavnagar', state: 'Gujarat', pincode: '364001' },
    },
    {
      name: 'Sunita Devi',
      email: 'sunita.devi@email.com',
      password: 'patient123',
      phone: '9222222222',
      dateOfBirth: new Date('1992-03-22'),
      gender: 'female',
      bloodGroup: 'A+',
      address: { street: '45 Gram Panchayat Nagar', city: 'Muzaffarpur', state: 'Bihar', pincode: '842001' },
    },
    {
      name: 'Gopal Yadav',
      email: 'gopal.yadav@email.com',
      password: 'patient123',
      phone: '9333333333',
      dateOfBirth: new Date('1978-11-08'),
      gender: 'male',
      bloodGroup: 'O+',
      address: { street: '78 Khet Nagar', city: 'Sagar', state: 'Madhya Pradesh', pincode: '470001' },
    },
  ];

  const patientUsers = [];
  for (const p of patientData) {
    const { name, email, password, phone, ...patientFields } = p;
    const user = await User.create({ name, email, password, phone, role: 'patient', isActive: true });
    const patient = await Patient.create({ user: user._id, ...patientFields });
    patientUsers.push({ user, patient });
  }
  console.log(`🧑‍🤝‍🧑 ${patientData.length} patients created`);

  // ─── Create Sample Appointments ───────────────────────────────────────────
  const now = new Date();
  const appointments = [
    {
      patient: patientUsers[0].user._id,
      doctor: doctorUsers[0].user._id,
      appointmentDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      timeSlot: '10:00 AM',
      status: 'approved',
      symptoms: ['fever', 'cough', 'fatigue'],
      notes: 'Experiencing fever for 3 days',
      consultationType: 'video',
    },
    {
      patient: patientUsers[1].user._id,
      doctor: doctorUsers[2].user._id,
      appointmentDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      timeSlot: '02:00 PM',
      status: 'completed',
      symptoms: ['stomach pain', 'nausea'],
      diagnosis: 'Mild gastritis. Prescribed antacids.',
      consultationType: 'video',
    },
    {
      patient: patientUsers[2].user._id,
      doctor: doctorUsers[0].user._id,
      appointmentDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      timeSlot: '11:00 AM',
      status: 'pending',
      symptoms: ['headache', 'dizziness'],
      notes: 'Recurring headaches for a week',
      consultationType: 'video',
    },
    {
      patient: patientUsers[0].user._id,
      doctor: doctorUsers[1].user._id,
      appointmentDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      timeSlot: '03:00 PM',
      status: 'completed',
      symptoms: ['sneezing', 'runny nose', 'sore throat'],
      diagnosis: 'Common Cold. Advised rest and fluid intake.',
      consultationType: 'chat',
    },
  ];

  const createdAppointments = await Appointment.insertMany(appointments);
  console.log(`📅 ${appointments.length} appointments created`);

  // ─── Create Sample Prescriptions ─────────────────────────────────────────
  await Prescription.create({
    appointment: createdAppointments[1]._id,
    patient: patientUsers[1].user._id,
    doctor: doctorUsers[2].user._id,
    diagnosis: 'Mild gastritis with acid reflux',
    medicines: [
      { name: 'Pantoprazole', dosage: '40mg', frequency: 'Once daily', duration: '14 days', instructions: 'Before breakfast' },
      { name: 'Domperidone', dosage: '10mg', frequency: 'Thrice daily', duration: '7 days', instructions: 'Before meals' },
    ],
    advice: 'Avoid spicy and oily food. Drink plenty of water. Sleep with head elevated.',
    followUpDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
  });

  await Prescription.create({
    appointment: createdAppointments[3]._id,
    patient: patientUsers[0].user._id,
    doctor: doctorUsers[1].user._id,
    diagnosis: 'Common Cold',
    medicines: [
      { name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily at night', duration: '5 days', instructions: 'After food' },
      { name: 'Paracetamol', dosage: '500mg', frequency: 'Thrice daily', duration: '3 days', instructions: 'After food if fever' },
    ],
    advice: 'Rest well. Drink warm fluids. Steam inhalation twice daily.',
  });
  console.log('💊 2 prescriptions created');

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('\n✅ Seed data created successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('─────────────────────────────────────────────');
  console.log('ADMIN:');
  console.log('  Email:    admin@telemedicine.com');
  console.log('  Password: admin123');
  console.log('\nDOCTOR (any of below):');
  doctorData.forEach((d) => console.log(`  Email: ${d.email}  | Password: doctor123`));
  console.log('\nPATIENT (any of below):');
  patientData.forEach((p) => console.log(`  Email: ${p.email}  | Password: patient123`));
  console.log('─────────────────────────────────────────────');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed error:', err.message);
  process.exit(1);
});
