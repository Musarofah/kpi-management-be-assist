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

    const mapMonthName = (m) => {
      const names = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return names[m - 1] || 'Unknown';
    };

    let assessment = await KpiAssessment.findOne({
      employee: empId,
      $or: [
        { period },
        { month, year },
      ],
    })
      .populate('employee', 'name email department position avatar')
      .populate('reviewedBy', 'name email avatar');

    // Buat format inputs
    let inputs = {};
    if (assessment && assessment.scores && assessment.scores.length > 0) {
      // Mapping dari database (jika Anda simpan di notes atau fields kustom)
      // Disini kita sediakan fallback aman jika data murni score
      inputs = {
        1: { onTime: 9, total: 10 },
        2: { onSla: 19, total: 20 },
        3: { bugCount: 2 },
        4: { count: 3 },
        5: { done: 0, total: 0 },
        6: { hours: 36 },
        7: { rejectCount: 2, totalTasks: 15 },
        8: { spEarned: 98, spTarget: 88 },
      };
    } else {
      // Ambil data dari Task riil jika blm ada
      const userTasks = await Task.find({ employee: empId });
      const completedTasks = userTasks.filter((t) => t.status === 'Done' || t.status === 'completed');
      const totalSP = completedTasks.reduce((sum, t) => sum + (t.storyPoint || 0), 0);
      const totalRejections = userTasks.reduce((sum, t) => sum + (t.rejectCount || 0), 0);
      
      inputs = {
        1: { onTime: completedTasks.length, total: userTasks.length || 1 },
        2: { onSla: completedTasks.length, total: userTasks.length || 1 },
        3: { bugCount: totalRejections },
        4: { count: 5 }, // Default
        5: { done: 1, total: 1 },
        6: { hours: 40 },
        7: { rejectCount: totalRejections, totalTasks: userTasks.length || 1 },
        8: { spEarned: totalSP, spTarget: 88 },
      };
    }

    res.json({
      success: true,
      data: {
        inputs,
        employeeId: empId,
        month: mapMonthName(month),
        year: year.toString(),
        assessmentId: assessment ? assessment._id : null,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// SAVE EVALUATIONS
exports.saveEvaluations = async (req, res) => {
  try {
    const {
      inputs,
      employeeId,
      month,
      year,
    } = req.body;

    const empId = employeeId || req.user.id;
    const mapMonthNumber = (mStr) => {
      const names = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const idx = names.indexOf(mStr);
      return idx !== -1 ? idx + 1 : new Date().getMonth() + 1;
    };

    const evalMonth = typeof month === 'string' ? mapMonthNumber(month) : (parseInt(month, 10) || new Date().getMonth() + 1);
    const evalYear = parseInt(year, 10) || new Date().getFullYear();
    const evalPeriod = `${evalYear}-${String(evalMonth).padStart(2, '0')}`;

    // Kita asumsikan FE menyimpan data inputs ke form, dan backend men-translate ke skor 1-8
    let calculatedScores = [];
    if (inputs) {
      // Logika kalkulasi kasar berdasarkan inputs
      calculatedScores = DEFAULT_8_KPI_METRICS.map((m, idx) => {
        let actual = 0;
        let score = 0;
        const i = inputs[idx + 1] || {};
        
        if (idx === 0) actual = i.onTime || 0;
        if (idx === 1) actual = i.onSla || 0;
        if (idx === 2) actual = i.bugCount || 0;
        if (idx === 3) actual = i.count || 0;
        if (idx === 4) actual = i.done || 0;
        if (idx === 5) actual = i.hours || 0;
        if (idx === 6) actual = i.rejectCount || 0;
        if (idx === 7) actual = i.spEarned || 0;

        // Dummy hitungan sederhana
        score = Math.min((actual / (m.target || 1)) * m.weight, m.weight * 1.2);

        return {
          ...m,
          actual,
          score: Math.round(score * 100) / 100,
        };
      });
    }

    const totalScore = calculateKpiTotalScore(calculatedScores);

    let assessment = await KpiAssessment.findOne({
      employee: empId,
      $or: [
        { period: evalPeriod },
        { month: evalMonth, year: evalYear },
      ],
    });

    if (assessment) {
      assessment.scores = calculatedScores;
      assessment.totalScore = totalScore;
      assessment.status = 'submitted';
      await assessment.save();
    } else {
      assessment = await KpiAssessment.create({
        employee: empId,
        period: evalPeriod,
        month: evalMonth,
        year: evalYear,
        scores: calculatedScores,
        totalScore,
        status: 'submitted',
        submittedAt: new Date(),
      });
    }

    res.json({
      success: true,
      message: 'Evaluasi capaian KPI berhasil disimpan',
      data: {
        success: true,
        ...req.body
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
