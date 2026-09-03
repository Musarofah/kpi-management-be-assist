const User = require('../models/User');
const Task = require('../models/Task');
const Department = require('../models/Department');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// GET ALL EMPLOYEES / TEAM DIRECTORY
exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) {
      filter.department = req.query.department;
    }
    // Jika req.query.role is strictly hr/admin/karyawan, then filter by role
    if (req.query.role && ['karyawan', 'hr', 'admin'].includes(req.query.role.toLowerCase())) {
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
        
        // Format joinDate like "01 Jan 2026"
        const joinDate = emp.createdAt 
          ? new Date(emp.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '') 
          : '01 Jan 2026';

        return {
          id: emp._id,
          _id: emp._id,
          name: emp.name,
          email: emp.email,
          role: emp.position || 'Staff', // FE expects role to be the job title (position)
          backendRole: emp.role, // We keep the real backend role here
          department: emp.department ? emp.department.name : '-', // FE expects a string
          position: emp.position,
          avatar: emp.avatar,
          joinDate: joinDate,
          status: 'Active',
          stats: {
            totalTasks: totalTasks || 0,
            activeTasks,
            completedTasks,
            // Mock FE stats that might not be in DB yet
            sprintPoints: 210,
            kpiLevel: 4,
            onTimeRate: "96%",
            slaBugRate: "98%",
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

    // Handle department mapping (FE usually sends string like "Engineering")
    let departmentId = department;
    if (department && !mongoose.Types.ObjectId.isValid(department)) {
      let dept = await Department.findOne({ name: new RegExp(`^${department}$`, 'i') });
      if (!dept) {
        dept = await Department.create({ name: department });
      }
      departmentId = dept._id;
    }

    // Handle role/position mapping (FE sends role="Frontend Developer")
    let userRole = role;
    let userPosition = position;
    if (role && !['karyawan', 'hr', 'admin'].includes(role.toLowerCase())) {
      userPosition = role;
      userRole = 'karyawan';
    } else if (!role) {
      userRole = 'karyawan';
    }
    
    if (!userPosition) {
      userPosition = 'Staff';
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: userRole.toLowerCase(),
      department: departmentId || undefined,
      position: userPosition,
      avatar: avatar || '',
    });

    const populatedUser = await User.findById(user._id).populate('department', 'name');

    const userData = {
      id: populatedUser._id,
      _id: populatedUser._id,
      name: populatedUser.name,
      email: populatedUser.email,
      role: populatedUser.position, // matching FE
      backendRole: populatedUser.role,
      department: populatedUser.department ? populatedUser.department.name : '-',
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

