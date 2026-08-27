require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const taskRoutes = require('../routes/taskRoutes');
const calendarRoutes = require('../routes/calendarRoutes');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('KPI Backend API is running');
});

app.use('/api/auth', require('../routes/authRoutes'));
app.use('/api/departments', require('../routes/departmentRoutes'));
app.use('/api/kpi-templates', require('../routes/kpiTemplateRoutes'));
app.use('/api/kpi-assessments', require('../routes/kpiAssessmentRoutes'));
app.use('/api/tasks', taskRoutes);
app.use('/api/calendar', calendarRoutes);

module.exports = app;