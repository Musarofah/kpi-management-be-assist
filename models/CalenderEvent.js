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
  status: {
    type: String,
    default: 'Scheduled',
  },
  team: {
    type: String,
    default: 'General',
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
