const mongoose = require('mongoose');

const taskHistorySchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true, // e.g., 'create', 'update_status', 'update_details'
  },
  previousStatus: {
    type: String,
  },
  newStatus: {
    type: String,
  },
  notes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('TaskHistory', taskHistorySchema);
