require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { seedHRUsers } = require('../utils/seed');

const app = express();

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

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await seedHRUsers();
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

app.get('/', (req, res) => {
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