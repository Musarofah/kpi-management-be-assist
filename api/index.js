require('dotenv').config();
const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const express = require('express');
const cors = require('cors');
const connectDB = require('../utils/connectDB');

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());

// Middleware: pastikan MongoDB terhubung sebelum setiap request diproses
// Ini WAJIB untuk Vercel serverless — tanpa ini, cold start akan timeout
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
    return res.status(503).json({
      success: false,
      message: 'Database tidak dapat dihubungi. Silakan coba lagi.',
    });
  }
});

app.get(['/', '/api'], (req, res) => {
  res.json({
    success: true,
    message: 'KPI Management Backend API is running smoothly 🚀',
    baseUrl: `/api`,
  });
});

app.use('/api/auth', require('../routes/authRoutes'));
app.use('/api/dashboard', require('../routes/dashboardRoutes'));
app.use('/api/employees', require('../routes/employeeRoutes'));
app.use('/api/tasks', require('../routes/taskRoutes'));
app.use('/api/calendar', require('../routes/calendarRoutes'));
app.use('/api/kpi', require('../routes/kpiRoutes'));
app.use('/api/departments', require('../routes/departmentRoutes'));
app.use('/api/kpi-templates', require('../routes/kpiTemplateRoutes'));
app.use('/api/kpi-assessments', require('../routes/kpiAssessmentRoutes'));

module.exports = app;