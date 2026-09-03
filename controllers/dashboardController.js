const Task = require('../models/Task');
const TaskHistory = require('../models/TaskHistory');
const User = require('../models/User');

// GET SPRINT STATS
exports.getStats = async (req, res) => {
  try {
    const tasks = await Task.find();
    const employeesCount = await User.countDocuments({ role: 'karyawan' });

    let totalTasks = tasks.length;
    let backlog = 0;
    let ready = 0;
    let inProgress = 0;
    let codeReview = 0;
    let qa = 0;
    let done = 0;

    let totalStoryPoints = 0;
    let completedStoryPoints = 0;
    let totalRejectCount = 0;

    tasks.forEach((t) => {
      const status = t.status ? t.status.toLowerCase() : '';
      const sp = Number(t.storyPoint) || 0;
      totalStoryPoints += sp;
      totalRejectCount += Number(t.rejectCount) || 0;

      if (status === 'backlog' || status === 'pending') {
        backlog++;
      } else if (status === 'ready') {
        ready++;
      } else if (status === 'on progress' || status === 'in-progress') {
        inProgress++;
      } else if (status === 'code review') {
        codeReview++;
      } else if (status === 'qa') {
        qa++;
      } else if (status === 'done' || status === 'completed') {
        done++;
        completedStoryPoints += sp;
      } else {
        backlog++;
      }
    });

    const sprintProgress = totalStoryPoints > 0 
      ? Math.round((completedStoryPoints / totalStoryPoints) * 100)
      : (totalTasks > 0 ? Math.round((done / totalTasks) * 100) : 0);

    const statsData = {
      totalTasks,
      completedTasks: done,
      inProgressTasks: inProgress,
      qaTasks: qa,
      codeReviewTasks: codeReview,
      readyTasks: ready,
      backlogTasks: backlog,
      statusBreakdown: {
        backlog,
        ready,
        inProgress,
        codeReview,
        qa,
        done,
      },
      storyPoints: {
        total: totalStoryPoints,
        completed: completedStoryPoints,
        remaining: totalStoryPoints - completedStoryPoints,
      },
      totalStoryPoints,
      completedStoryPoints,
      sprintProgress,
      totalEmployees: employeesCount,
      backwardCountTotal: totalRejectCount,
      sprintVelocity: completedStoryPoints,
    };

    res.json({
      success: true,
      data: statsData,
      stats: statsData,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET SPRINT TASKS
exports.getSprintTasks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.sprint) {
      filter.sprint = req.query.sprint;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const tasks = await Task.find(filter)
      .populate('employee', 'name email department position avatar')
      .populate('assignedBy', 'name email avatar')
      .sort({ updatedAt: -1, createdAt: -1 });

    const formattedTasks = tasks.map(task => {
      const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toISOString().split('T')[0];
      };

      return {
        id: task._id,
        _id: task._id,
        title: task.title,
        point: task.storyPoint || 0,
        start: formatDate(task.startDate),
        deadline: formatDate(task.dueDate),
        status: task.status,
        assignee: task.employee ? task.employee.name : 'Unassigned',
      };
    });

    res.json({
      success: true,
      data: formattedTasks,
      tasks: formattedTasks,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE SPRINT TASK (HR Only)
exports.updateSprintTask = async (req, res) => {
  try {
    const { title, description, employee, dueDate, kpiIndicator, storyPoint, priority, status, sprint } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task tidak ditemukan' });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (employee !== undefined) task.employee = employee;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (kpiIndicator !== undefined) task.kpiIndicator = kpiIndicator;
    if (storyPoint !== undefined) task.storyPoint = storyPoint;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    if (sprint !== undefined) task.sprint = sprint;

    await task.save();

    await TaskHistory.create({
      task: task._id,
      user: req.user.id,
      action: 'update_sprint_task',
      notes: 'Task sprint diperbarui oleh HR',
    });

    const populatedTask = await Task.findById(task._id)
      .populate('employee', 'name email department position avatar')
      .populate('assignedBy', 'name email avatar');

    res.json({
      success: true,
      message: 'Task sprint berhasil diperbarui',
      data: populatedTask,
      task: populatedTask,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE SPRINT TASK (HR Only)
exports.deleteSprintTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task tidak ditemukan' });
    }

    await TaskHistory.deleteMany({ task: req.params.id });

    res.json({
      success: true,
      message: 'Task sprint berhasil dihapus',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
