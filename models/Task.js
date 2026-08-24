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
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending',
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
