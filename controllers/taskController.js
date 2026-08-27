const Task = require('../models/Task');
const TaskHistory = require('../models/TaskHistory');

// Normalize status string to Kanban standard
const normalizeStatus = (status) => {
  if (!status) return 'Backlog';
  const s = status.trim().toLowerCase();
  if (s === 'backlog' || s === 'pending') return 'Backlog';
  if (s === 'ready') return 'Ready';
  if (s === 'on progress' || s === 'in-progress' || s === 'inprogress' || s === 'onprogress') return 'On Progress';
  if (s === 'code review' || s === 'codereview' || s === 'review') return 'Code Review';
  if (s === 'qa') return 'QA';
  if (s === 'done' || s === 'completed') return 'Done';
  return status;
};

// GET ALL TASKS (Kanban & List)
exports.getAll = async (req, res) => {
  try {
    const filter = {};

    // Karyawan: jika diinginkan filter hanya miliknya saat query `my=true` atau default jika role karyawan
    if (req.user && req.user.role === 'karyawan' && req.query.my === 'true') {
      filter.employee = req.user.id;
    }

    if (req.query.employee) {
      filter.employee = req.query.employee;
    }

    if (req.query.status) {
      filter.status = normalizeStatus(req.query.status);
    }

    if (req.query.sprint) {
      filter.sprint = req.query.sprint;
    }

    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    if (req.query.kpiIndicator) {
      filter.kpiIndicator = req.query.kpiIndicator;
    }

    const tasks = await Task.find(filter)
      .populate('employee', 'name email department position avatar')
      .populate('assignedBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      data: tasks,
      tasks,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET TASK BY ID
exports.getById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('employee', 'name email department position avatar')
      .populate('assignedBy', 'name email avatar');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task tidak ditemukan' });
    }

    res.json({
      success: true,
      data: task,
      task,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE TASK
exports.create = async (req, res) => {
  try {
    const {
      title,
      description,
      employee,
      dueDate,
      kpiIndicator,
      storyPoint,
      priority,
      status,
      sprint,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Judul task wajib diisi',
      });
    }

    const assignedEmployee = employee || req.user.id;
    const taskDueDate = dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // default +7 hari
    const initialStatus = status ? normalizeStatus(status) : 'Backlog';

    const task = await Task.create({
      title,
      description: description || '',
      employee: assignedEmployee,
      assignedBy: req.user.id,
      dueDate: taskDueDate,
      kpiIndicator: kpiIndicator || '',
      storyPoint: Number(storyPoint) || 0,
      priority: priority || 'Medium',
      status: initialStatus,
      sprint: sprint || 'Sprint 1',
      isActiveSprint: true,
      rejectCount: 0,
    });

    await TaskHistory.create({
      task: task._id,
      user: req.user.id,
      action: 'create',
      newStatus: initialStatus,
      notes: 'Task dibuat',
    });

    const populatedTask = await Task.findById(task._id)
      .populate('employee', 'name email department position avatar')
      .populate('assignedBy', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Task berhasil dibuat',
      data: populatedTask,
      task: populatedTask,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE TASK DETAILS (HR Only)
exports.update = async (req, res) => {
  try {
    const {
      title,
      description,
      employee,
      dueDate,
      kpiIndicator,
      storyPoint,
      priority,
      status,
      sprint,
    } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task tidak ditemukan' });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (employee !== undefined) task.employee = employee;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (kpiIndicator !== undefined) task.kpiIndicator = kpiIndicator;
    if (storyPoint !== undefined) task.storyPoint = Number(storyPoint);
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = normalizeStatus(status);
    if (sprint !== undefined) task.sprint = sprint;

    await task.save();

    await TaskHistory.create({
      task: task._id,
      user: req.user.id,
      action: 'update_details',
      notes: 'Detail task diperbarui',
    });

    const populatedTask = await Task.findById(task._id)
      .populate('employee', 'name email department position avatar')
      .populate('assignedBy', 'name email avatar');

    res.json({
      success: true,
      message: 'Task berhasil diperbarui',
      data: populatedTask,
      task: populatedTask,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE TASK STATUS (Kanban Columns)
exports.updateStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status wajib diisi',
      });
    }

    const newStatus = normalizeStatus(status);

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task tidak ditemukan' });
    }

    const previousStatus = task.status;
    task.status = newStatus;
    await task.save();

    await TaskHistory.create({
      task: task._id,
      user: req.user.id,
      action: 'update_status',
      previousStatus,
      newStatus,
      notes: notes || `Status diubah dari ${previousStatus} menjadi ${newStatus}`,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('employee', 'name email department position avatar')
      .populate('assignedBy', 'name email avatar');

    res.json({
      success: true,
      message: `Status task berhasil diperbarui menjadi ${newStatus}`,
      data: populatedTask,
      task: populatedTask,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE STORY POINT (Khusus HR / PO)
exports.updateStoryPoint = async (req, res) => {
  try {
    const { storyPoint, point, sp } = req.body;
    const pointValue = storyPoint !== undefined ? storyPoint : (point !== undefined ? point : sp);

    if (pointValue === undefined || isNaN(Number(pointValue))) {
      return res.status(400).json({
        success: false,
        message: 'Nilai Story Point (angka) wajib diisi',
      });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task tidak ditemukan' });
    }

    task.storyPoint = Number(pointValue);
    await task.save();

    await TaskHistory.create({
      task: task._id,
      user: req.user.id,
      action: 'update_point',
      notes: `Story Point diperbarui menjadi ${task.storyPoint} SP`,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('employee', 'name email department position avatar')
      .populate('assignedBy', 'name email avatar');

    res.json({
      success: true,
      message: `Story Point berhasil diset ke ${task.storyPoint} SP`,
      data: populatedTask,
      task: populatedTask,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// REJECT QA (Task mental kembali ke On Progress dengan backward counter)
exports.rejectQA = async (req, res) => {
  try {
    const { reason, notes } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task tidak ditemukan' });
    }

    const previousStatus = task.status;
    task.status = 'On Progress';
    task.rejectCount = (task.rejectCount || 0) + 1;
    await task.save();

    const rejectNote = reason || notes || `QA Rejected: Ditolak dan dikembalikan ke On Progress (Reject count: ${task.rejectCount})`;

    await TaskHistory.create({
      task: task._id,
      user: req.user.id,
      action: 'reject_qa',
      previousStatus,
      newStatus: 'On Progress',
      notes: rejectNote,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('employee', 'name email department position avatar')
      .populate('assignedBy', 'name email avatar');

    res.json({
      success: true,
      message: `Task berhasil di-reject QA dan dikembalikan ke On Progress (Total reject: ${task.rejectCount})`,
      data: populatedTask,
      task: populatedTask,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE TASK (HR Only)
exports.remove = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task tidak ditemukan' });
    }

    await TaskHistory.deleteMany({ task: req.params.id });

    res.json({
      success: true,
      message: 'Task beserta log historinya berhasil dihapus',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET TASK HISTORY
exports.getHistory = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task tidak ditemukan' });
    }

    const history = await TaskHistory.find({ task: req.params.id })
      .populate('user', 'name email role avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: history,
      history,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
