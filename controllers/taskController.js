const Task = require('../models/Task');
const TaskHistory = require('../models/TaskHistory');

// GET ALL TASKS
exports.getAll = async (req, res) => {
  try {
    const filter = {};

    // Karyawan hanya bisa melihat task miliknya sendiri
    if (req.user.role === 'karyawan') {
      filter.employee = req.user.id;
    }

    // HR bisa melakukan filter berdasarkan employee, status, kpiIndicator
    if (req.user.role === 'hr') {
      if (req.query.employee) {
        filter.employee = req.query.employee;
      }
      if (req.query.assignedBy) {
        filter.assignedBy = req.query.assignedBy;
      }
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.kpiIndicator) {
      filter.kpiIndicator = req.query.kpiIndicator;
    }

    const tasks = await Task.find(filter)
      .populate('employee', 'name email department position')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET TASK BY ID
exports.getById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('employee', 'name email department position')
      .populate('assignedBy', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task tidak ditemukan' });
    }

    // Karyawan hanya bisa mengakses task milik sendiri
    if (req.user.role === 'karyawan' && task.employee._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE TASK (HR Only)
exports.create = async (req, res) => {
  try {
    const { title, description, employee, dueDate, kpiIndicator } = req.body;

    if (!title || !employee || !dueDate) {
      return res.status(400).json({ message: 'Judul, karyawan penerima, dan due date wajib diisi' });
    }

    const task = await Task.create({
      title,
      description,
      employee,
      assignedBy: req.user.id,
      dueDate,
      kpiIndicator,
      status: 'pending',
    });

    // Catat histori pembuatan task
    await TaskHistory.create({
      task: task._id,
      user: req.user.id,
      action: 'create',
      newStatus: 'pending',
      notes: 'Task dibuat oleh HR',
    });

    res.status(201).json({
      message: 'Task berhasil dibuat',
      task,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE TASK DETAILS (HR Only)
exports.update = async (req, res) => {
  try {
    const { title, description, employee, dueDate, kpiIndicator } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task tidak ditemukan' });
    }

    // Update fields jika disediakan
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (employee !== undefined) task.employee = employee;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (kpiIndicator !== undefined) task.kpiIndicator = kpiIndicator;

    await task.save();

    // Catat histori update detail task
    await TaskHistory.create({
      task: task._id,
      user: req.user.id,
      action: 'update_details',
      notes: 'Detail task diperbarui oleh HR',
    });

    res.json({
      message: 'Task berhasil diperbarui',
      task,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE TASK STATUS (Karyawan & HR)
exports.updateStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status wajib diisi' });
    }

    const validStatuses = ['pending', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task tidak ditemukan' });
    }

    // Karyawan hanya bisa update status task miliknya sendiri
    if (req.user.role === 'karyawan' && task.employee.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Akses ditolak, hanya penerima tugas yang bisa mengubah status' });
    }

    const previousStatus = task.status;
    task.status = status;
    await task.save();

    // Catat histori perubahan status
    await TaskHistory.create({
      task: task._id,
      user: req.user.id,
      action: 'update_status',
      previousStatus,
      newStatus: status,
      notes: notes || `Status diubah dari ${previousStatus} menjadi ${status}`,
    });

    res.json({
      message: 'Status task berhasil diperbarui',
      task,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE TASK (HR Only)
exports.remove = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task tidak ditemukan' });
    }

    // Hapus histori task yang bersangkutan (cascade delete)
    await TaskHistory.deleteMany({ task: req.params.id });

    res.json({ message: 'Task beserta log historinya berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET TASK HISTORY
exports.getHistory = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task tidak ditemukan' });
    }

    // Karyawan hanya bisa melihat history task miliknya sendiri
    if (req.user.role === 'karyawan' && task.employee.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    const history = await TaskHistory.find({ task: req.params.id })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
