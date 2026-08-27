const mongoose = require('mongoose');

const kpiAssessmentSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KpiTemplate',
    required: false,
  },
  period: {
    type: String,
    required: true,
  },
  month: {
    type: Number,
  },
  year: {
    type: Number,
  },
  scores: [
    {
      indicatorName: String,
      category: String,
      target: Number,
      actual: Number,
      weight: Number,
      score: Number, // hasil kalkulasi (actual/target * weight)
      unit: String,
      note: String,
    }
  ],
  totalScore: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewNote: {
    type: String,
    default: '',
  },
  submittedAt: Date,
  reviewedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('KpiAssessment', kpiAssessmentSchema);