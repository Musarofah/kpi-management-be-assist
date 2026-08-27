const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Judul task wajib diisi'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Karyawan penerima task wajib diisi'],
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: [
      'Backlog', 'Ready', 'On Progress', 'Code Review', 'QA', 'Done',
      'pending', 'in-progress', 'completed', 'cancelled'
    ],
    default: 'Backlog',
  },
  storyPoint: {
    type: Number,
    default: 0,
  },
  rejectCount: {
    type: Number,
    default: 0, // Backward counter saat task mental dari QA kembali ke On Progress
  },
  sprint: {
    type: String,
    default: 'Sprint 1',
  },
  isActiveSprint: {
    type: Boolean,
    default: true,
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium',
  },
  dueDate: {
    type: Date,
    required: [true, 'Tenggat waktu (due date) wajib diisi'],
  },
  kpiIndicator: {
    type: String, // Menghubungkan task dengan indikator KPI tertentu
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
