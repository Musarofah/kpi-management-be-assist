const Department = require('../models/Department');

// GET ALL — list semua department
exports.getAll = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    
    const formattedDepartments = departments.map(dep => ({
      id: dep._id,
      _id: dep._id,
      name: dep.name,
      code: dep.code || dep.name.substring(0, 3).toUpperCase(),
      head: dep.head || 'Unassigned',
      employeeCount: dep.employeeCount || 0,
      description: dep.description
    }));

    res.json({
      success: true,
      data: formattedDepartments,
      departments: formattedDepartments // for legacy support if needed
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET BY ID — detail department
exports.getById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department tidak ditemukan' });
    }
    res.json({ success: true, data: department });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE — buat department baru (HR only)
exports.create = async (req, res) => {
  try {
    const { name, description, code, head, employeeCount } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Nama department wajib diisi' });
    }

    const existing = await Department.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Department sudah ada' });
    }

    const department = await Department.create({ 
      name, 
      description: description || '',
      code: code || name.substring(0, 3).toUpperCase(),
      head: head || 'Unassigned',
      employeeCount: employeeCount || 0
    });
    
    res.status(201).json({
      success: true,
      message: 'Department berhasil dibuat',
      department,
      data: department
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE — update department (HR only)
exports.update = async (req, res) => {
  try {
    const { name, description, code, head, employeeCount } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (code !== undefined) updateData.code = code;
    if (head !== undefined) updateData.head = head;
    if (employeeCount !== undefined) updateData.employeeCount = employeeCount;

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department tidak ditemukan' });
    }

    res.json({
      success: true,
      message: 'Department berhasil diupdate',
      department,
      data: department
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
