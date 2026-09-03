const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Judul event wajib diisi'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  date: {
    type: Date,
    required: [true, 'Tanggal event wajib diisi'],
  },
  endDate: {
    type: Date,
  },
  eventType: {
    type: String,
    enum: ['sprint_deadline', 'sprint_planning', 'review', 'retro', 'meeting', 'holiday', 'agenda', 'other'],
    default: 'agenda',
  },
  category: {
    type: String,
    default: 'Feature',
  },
  status: {
    type: String,
    default: 'Scheduled',
  },
  team: {
    type: String,
    default: 'General',
  },
  color: {
    type: String,
    default: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  relatedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);

