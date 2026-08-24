const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nama wajib diisi'],
  },
  email: {
    type: String,
    required: [true, 'Email wajib diisi'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password wajib diisi'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['karyawan', 'hr'],
    default: 'karyawan',
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  position: {
    type: String,
    default: '',
  },
}, { timestamps: true }); // otomatis nambah createdAt & updatedAt

module.exports = mongoose.model('User', userSchema);