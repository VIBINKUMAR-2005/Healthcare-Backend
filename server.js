const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const morgan   = require('morgan');
const dotenv   = require('dotenv');

// ─── Load .env first ──────────────────────────────────────────────────────────
dotenv.config();

// ─── Guard: fail fast if critical vars are missing ────────────────────────────
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('❌ FATAL: MONGO_URI is not defined in .env');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET is not defined in .env');
  process.exit(1);
}

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
// In development the CRA proxy (package.json "proxy") forwards requests from
// the browser.  The forwarded Origin header can be localhost:3000, :5000, or
// absent (Postman / server-to-server).  We accept all of them in dev.
//
// For production set NODE_ENV=production and CLIENT_URL to your real domain.

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5000',   // CRA proxy sometimes sends this as the origin
  'http://127.0.0.1:5000',
  'https://healthcare-frontend-liart.vercel.app',
];

// Add any extra URL from .env (production frontend URL)
if (process.env.CLIENT_URL) allowedOrigins.push(process.env.CLIENT_URL);

const corsOptions = {
  origin: (incomingOrigin, callback) => {
    // No origin = Postman / curl / same-server request → always allow
    if (!incomingOrigin) return callback(null, true);

    // Development: allow all localhost regardless of port
    if (process.env.NODE_ENV !== 'production') {
      if (
        incomingOrigin.startsWith('http://localhost') ||
        incomingOrigin.startsWith('http://127.0.0.1')
      ) {
        return callback(null, true);
      }
    }

    // Production: check explicit allowlist
    if (allowedOrigins.includes(incomingOrigin)) return callback(null, true);

    // Reject — use callback(null, false) NOT callback(new Error(...))
    // so Express does NOT hand it to the error middleware as a 500.
    console.warn(`⚠️  CORS blocked origin: ${incomingOrigin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

// Must be the VERY FIRST middleware so pre-flight OPTIONS requests are handled
app.use(cors(corsOptions));

// Explicitly handle pre-flight for all routes
app.options('*', cors(corsOptions));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── HTTP request logging (dev only) ──────────────────────────────────────────
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/patients',      require('./routes/patientRoutes'));
app.use('/api/doctors',       require('./routes/doctorRoutes'));
app.use('/api/appointments',  require('./routes/appointmentRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/symptoms',      require('./routes/symptomRoutes'));
app.use('/api/admin',         require('./routes/adminRoutes'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) =>
  res.json({
    success: true,
    message: 'RuralCare Telemedicine API is running',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    env: process.env.NODE_ENV,
  })
);

// ─── 404 catch-all ────────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
);

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('🔴 Unhandled error:', err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ─── Connect MongoDB Atlas → start Express ────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 5000;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Atlas connected');
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
