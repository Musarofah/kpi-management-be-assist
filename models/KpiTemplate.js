const mongoose = require('mongoose');

const kpiTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // misal "KPI Sales Q1 2026"
  },
  role: {
    type: String,
    default: 'Karyawan',
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  period: {
    type: String,
    required: true, // misal "2026-Q1" atau "2026-08"
  },
  indicators: [
    {
      no: { type: Number },
      name: { type: String, required: true },     // misal "Jumlah Closing Deal"
      weight: { type: Number, required: true },    // bobot dalam %, misal 30
      target: { type: String, required: true },    // target sebagai string "90%" atau "< 3 Bug"
      unit: { type: String, default: '' },         // "deal", "%", "poin"
    }
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

module.exports = mongoose.model('KpiTemplate', kpiTemplateSchema);