const KpiAssessment = require('../models/KpiAssessment');
const Task = require('../models/Task');
const User = require('../models/User');

// 8 Metrik Standar Evaluasi KPI Tim
const DEFAULT_8_KPI_METRICS = [
  {
    indicatorName: 'Sprint Velocity & Story Point Achievement',
    category: 'Productivity',
    target: 25,
    actual: 0,
    weight: 20,
    unit: 'SP',
    score: 0,
    note: 'Pencapaian Story Point yang diselesaikan dalam sprint.',
  },
  {
    indicatorName: 'Code Quality & QA Pass Rate',
    category: 'Quality',
    target: 95,
    actual: 0,
    weight: 15,
    unit: '%',
    score: 0,
    note: 'Tingkat kelulusan pengujian QA tanpa backward rejection.',
  },
  {
    indicatorName: 'Task Delivery & On-Time Timeliness',
    category: 'Timeliness',
    target: 100,
    actual: 0,
    weight: 15,
    unit: '%',
    score: 0,
    note: 'Ketepatan waktu penyelesaian tugas sesuai tenggat waktu.',
  },
  {
    indicatorName: 'Code Review & Pull Request Participation',
    category: 'Engineering',
    target: 10,
    actual: 0,
    weight: 10,
    unit: 'PR',
    score: 0,
    note: 'Keaktifan dalam melakukan code review dan memberi feedback bermutu.',
  },
  {
    indicatorName: 'Technical Problem Solving & Innovation',
    category: 'Technical',
    target: 5,
    actual: 0,
    weight: 10,
    unit: 'kasus',
    score: 0,
    note: 'Kemampuan menyelesaikan blocker arsitektural dan bug kritis.',
  },
  {
    indicatorName: 'Agile Ceremonies & Sprint Attendance',
    category: 'Discipline',
    target: 100,
    actual: 0,
    weight: 10,
    unit: '%',
    score: 0,
    note: 'Kehadiran dan keaktifan pada Daily Standup, Planning, dan Retro.',
  },
  {
    indicatorName: 'Team Collaboration & Communication',
    category: 'Soft Skill',
    target: 90,
    actual: 0,
    weight: 10,
    unit: 'poin',
    score: 0,
    note: 'Kerjasama tim, transparansi status, dan respon proaktif.',
  },
  {
    indicatorName: 'Continuous Learning & Knowledge Sharing',
    category: 'Growth',
    target: 2,
    actual: 0,
    weight: 10,
    unit: 'sesi',
    score: 0,
    note: 'Inisiatif tech-talk, dokumentasi, dan adopsi best practice.',
  },
];

// Helper to calculate total KPI score
const calculateKpiTotalScore = (scores) => {
  let total = 0;
  scores.forEach((s) => {
    const target = Number(s.target) || 1;
    const actual = Number(s.actual) || 0;
    const weight = Number(s.weight) || 0;
    // Cap calculation to maximum 120% per indicator
    const rawScore = Math.min((actual / target) * weight, weight * 1.2);
    s.score = Math.round(rawScore * 100) / 100;
    total += s.score;
  });
  return Math.round(total * 100) / 100;
};

// GET EVALUATIONS (?empId=X&month=Y&year=Z)
exports.getEvaluations = async (req, res) => {
  try {
    const empId = req.query.empId || req.query.employee || req.query.employeeId || req.user.id;
    const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const period = `${year}-${String(month).padStart(2, '0')}`;

    // Cari assessment yang sudah ada di database
    let assessment = await KpiAssessment.findOne({
      employee: empId,
      $or: [
        { period },
        { month, year },
      ],
    })
      .populate('employee', 'name email department position avatar')
      .populate('reviewedBy', 'name email avatar');

    if (!assessment) {
      // Ambil data statistik riil dari Task karyawan jika ada
      const userTasks = await Task.find({ employee: empId });
      const completedTasks = userTasks.filter((t) => t.status === 'Done' || t.status === 'completed');
      const totalSP = completedTasks.reduce((sum, t) => sum + (t.storyPoint || 0), 0);
      const totalRejections = userTasks.reduce((sum, t) => sum + (t.rejectCount || 0), 0);
      const qaPassRate = userTasks.length > 0 
        ? Math.max(0, Math.round(((userTasks.length - totalRejections) / userTasks.length) * 100))
        : 100;

      // Buat scores default 8 metrik dengan data terisi
      const initialScores = DEFAULT_8_KPI_METRICS.map((m) => {
        let actual = 0;
        if (m.indicatorName.includes('Velocity')) {
          actual = totalSP || 18;
        } else if (m.indicatorName.includes('Code Quality')) {
          actual = qaPassRate || 95;
        } else if (m.indicatorName.includes('Task Delivery')) {
          actual = 90;
        } else if (m.indicatorName.includes('Code Review')) {
          actual = 8;
        } else if (m.indicatorName.includes('Problem Solving')) {
          actual = 4;
        } else if (m.indicatorName.includes('Agile')) {
          actual = 100;
        } else if (m.indicatorName.includes('Team Collaboration')) {
          actual = 88;
        } else if (m.indicatorName.includes('Learning')) {
          actual = 2;
        }

        const score = Math.round(((actual / m.target) * m.weight) * 100) / 100;
        return {
          ...m,
          actual,
          score,
        };
      });

      const totalScore = calculateKpiTotalScore(initialScores);
      const employeeData = await User.findById(empId).select('name email department position avatar');

      return res.json({
        success: true,
        data: {
          employee: employeeData,
          period,
          month,
          year,
          status: 'draft',
          totalScore,
          metricsCount: 8,
          scores: initialScores,
          isNew: true,
        },
      });
    }

    res.json({
      success: true,
      data: {
        id: assessment._id,
        _id: assessment._id,
        employee: assessment.employee,
        period: assessment.period,
        month: assessment.month || month,
        year: assessment.year || year,
        status: assessment.status,
        totalScore: assessment.totalScore,
        reviewNote: assessment.reviewNote,
        reviewedBy: assessment.reviewedBy,
        submittedAt: assessment.submittedAt,
        reviewedAt: assessment.reviewedAt,
        metricsCount: assessment.scores.length,
        scores: assessment.scores,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// SAVE EVALUATIONS
exports.saveEvaluations = async (req, res) => {
  try {
    const {
      empId,
      employee,
      month,
      year,
      period,
      scores,
      status,
      reviewNote,
    } = req.body;

    const employeeId = empId || employee || req.user.id;
    const evalMonth = parseInt(month, 10) || new Date().getMonth() + 1;
    const evalYear = parseInt(year, 10) || new Date().getFullYear();
    const evalPeriod = period || `${evalYear}-${String(evalMonth).padStart(2, '0')}`;

    if (!scores || !Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Daftar skor evaluasi (scores) wajib dikirim',
      });
    }

    const calculatedScores = [...scores];
    const totalScore = calculateKpiTotalScore(calculatedScores);

    let assessment = await KpiAssessment.findOne({
      employee: employeeId,
      $or: [
        { period: evalPeriod },
        { month: evalMonth, year: evalYear },
      ],
    });

    if (assessment) {
      assessment.scores = calculatedScores;
      assessment.totalScore = totalScore;
      assessment.month = evalMonth;
      assessment.year = evalYear;
      assessment.period = evalPeriod;
      if (status) assessment.status = status;
      if (reviewNote !== undefined) assessment.reviewNote = reviewNote;
      if (req.user.role === 'hr') {
        assessment.reviewedBy = req.user.id;
        assessment.reviewedAt = new Date();
      }
      await assessment.save();
    } else {
      assessment = await KpiAssessment.create({
        employee: employeeId,
        period: evalPeriod,
        month: evalMonth,
        year: evalYear,
        scores: calculatedScores,
        totalScore,
        status: status || 'submitted',
        reviewNote: reviewNote || '',
        submittedAt: new Date(),
        reviewedBy: req.user.role === 'hr' ? req.user.id : undefined,
      });
    }

    const populatedAssessment = await KpiAssessment.findById(assessment._id)
      .populate('employee', 'name email department position avatar')
      .populate('reviewedBy', 'name email avatar');

    res.json({
      success: true,
      message: 'Evaluasi capaian KPI berhasil disimpan',
      data: populatedAssessment,
      assessment: populatedAssessment,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
