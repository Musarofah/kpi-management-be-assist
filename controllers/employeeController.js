const User = require('../models/User');
const Task = require('../models/Task');
const bcrypt = require('bcryptjs');

// GET ALL EMPLOYEES / TEAM DIRECTORY
exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) {
      filter.department = req.query.department;
    }
    if (req.query.role) {
      filter.role = req.query.role;
    }

    const employees = await User.find(filter)
      .populate('department', 'name description')
      .sort({ createdAt: -1 });

    // Aggregate summary for each employee
    const employeesWithStats = await Promise.all(
      employees.map(async (emp) => {
        const totalTasks = await Task.countDocuments({ employee: emp._id });
        const completedTasks = await Task.countDocuments({
          employee: emp._id,
          status: { $in: ['Done', 'completed'] },
        });
        const activeTasks = totalTasks - completedTasks;

        return {
          id: emp._id,
          _id: emp._id,
          name: emp.name,
          email: emp.email,
          role: emp.role,
          department: emp.department,
          position: emp.position,
          avatar: emp.avatar,
          stats: {
            totalTasks,
            activeTasks,
            completedTasks,
          },
          createdAt: emp.createdAt,
        };
      })
    );

    res.json({
      success: true,
      count: employeesWithStats.length,
      data: employeesWithStats,
      employees: employeesWithStats,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE EMPLOYEE (HR Only)
exports.create = async (req, res) => {
  try {
    const { name, email, password, role, department, position, avatar } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan email wajib diisi',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar',
      });
    }

    const rawPassword = password || 'Password123!';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'karyawan',
      department: department || undefined,
      position: position || 'Staff',
      avatar: avatar || '',
    });

    const populatedUser = await User.findById(user._id).populate('department', 'name');

    const userData = {
      id: populatedUser._id,
      _id: populatedUser._id,
      name: populatedUser.name,
      email: populatedUser.email,
      role: populatedUser.role,
      department: populatedUser.department,
      position: populatedUser.position,
      avatar: populatedUser.avatar,
      createdAt: populatedUser.createdAt,
    };

    res.status(201).json({
      success: true,
      message: 'Profil karyawan baru berhasil ditambahkan',
      data: userData,
      employee: userData,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
