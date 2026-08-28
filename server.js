require('dotenv').config();
const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { seedHRUsers } = require('./utils/seed');

const app = express();
app.set('trust proxy', 1);

// Allowed Origins for CORS (Support Vite 5173, CRA/Next 3000, 127.0.0.1, and FRONTEND_URL)
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
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in dev mode to ensure seamless FE connection
  },
  credentials: true,
}));

app.use(express.json());

// MongoDB connection + HR accounts auto-seeder
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await seedHRUsers();
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

app.get(['/', '/api'], (req, res) => {
  res.json({
    success: true,
    message: 'KPI Management Backend API is running smoothly 🚀',
    baseUrl: `http://localhost:${process.env.PORT || 5000}/api`,
    endpoints: [
      '/api/auth',
      '/api/dashboard',
      '/api/employees',
      '/api/tasks',
      '/api/calendar',
      '/api/kpi',
      '/api/departments',
      '/api/kpi-templates',
      '/api/kpi-assessments',
    ],
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/calendar', require('./routes/calendarRoutes'));
app.use('/api/kpi', require('./routes/kpiRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/kpi-templates', require('./routes/kpiTemplateRoutes'));
app.use('/api/kpi-assessments', require('./routes/kpiAssessmentRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Base API URL: http://localhost:${PORT}/api`);
});