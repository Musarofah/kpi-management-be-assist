const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    default: '',
  },
  head: {
    type: String,
    default: 'Unassigned',
  },
  employeeCount: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);