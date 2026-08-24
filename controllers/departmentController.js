const Department = require('../models/Department');

// GET ALL — list semua department
exports.getAll = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET BY ID — detail department
exports.getById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department tidak ditemukan' });
    }
    res.json(department);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE — buat department baru (HR only)
exports.create = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Nama department wajib diisi' });
    }

    const existing = await Department.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'Department sudah ada' });
    }

    const department = await Department.create({ name, description });
    res.status(201).json({
      message: 'Department berhasil dibuat',
      department,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE — update department (HR only)
exports.update = async (req, res) => {
  try {
    const { name, description } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true, runValidators: true }
    );

    if (!department) {
      return res.status(404).json({ message: 'Department tidak ditemukan' });
    }

    res.json({
      message: 'Department berhasil diupdate',
      department,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE — hapus department (HR only)
exports.remove = async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department tidak ditemukan' });
    }

    res.json({ message: 'Department berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
