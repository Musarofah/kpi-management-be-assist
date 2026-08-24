const KpiAssessment = require('../models/KpiAssessment');
const KpiTemplate = require('../models/KpiTemplate');

// GET ALL — list assessments
// Karyawan: hanya milik sendiri, HR: semua (bisa filter)
exports.getAll = async (req, res) => {
  try {
    const filter = {};

    // Karyawan hanya bisa lihat punya sendiri
    if (req.user.role === 'karyawan') {
      filter.employee = req.user.id;
    }

    // HR bisa filter by employee
    if (req.query.employee && req.user.role === 'hr') {
      filter.employee = req.query.employee;
    }

    if (req.query.period) {
      filter.period = req.query.period;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const assessments = await KpiAssessment.find(filter)
      .populate('employee', 'name email department position')
      .populate('template', 'name period')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(assessments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET BY ID — detail assessment
exports.getById = async (req, res) => {
  try {
    const assessment = await KpiAssessment.findById(req.params.id)
      .populate('employee', 'name email department position')
      .populate('template', 'name period indicators')
      .populate('reviewedBy', 'name email');

    if (!assessment) {
      return res.status(404).json({ message: 'KPI Assessment tidak ditemukan' });
    }

    // Karyawan hanya bisa lihat punya sendiri
    if (req.user.role === 'karyawan' && assessment.employee._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    res.json(assessment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE — buat assessment baru
exports.create = async (req, res) => {
  try {
    const { template: templateId, period, employee } = req.body;

    if (!templateId || !period) {
      return res.status(400).json({ message: 'Template dan period wajib diisi' });
    }

    // Tentukan employee ID (karyawan untuk dirinya sendiri, HR bisa menentukan employee lain)
    let employeeId = req.user.id;
    if (req.user.role === 'hr' && employee) {
      employeeId = employee;
    }

    // Ambil template untuk generate scores awal
    const template = await KpiTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: 'KPI Template tidak ditemukan' });
    }

    // Cek apakah sudah ada assessment untuk employee+template+period yang sama
    const existing = await KpiAssessment.findOne({
      employee: employeeId,
      template: templateId,
      period,
    });
    if (existing) {
      return res.status(400).json({
        message: 'Assessment untuk template dan period ini sudah ada',
      });
    }

    // Generate scores kosong dari template indicators
    const scores = template.indicators.map((ind) => ({
      indicatorName: ind.name,
      target: ind.target,
      actual: 0,
      score: 0,
    }));

    const assessment = await KpiAssessment.create({
      employee: employeeId,
      template: templateId,
      period,
      scores,
      totalScore: 0,
      status: 'draft',
    });

    res.status(201).json({
      message: 'KPI Assessment berhasil dibuat',
      assessment,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE — update scores assessment (isi nilai actual)
exports.update = async (req, res) => {
  try {
    const assessment = await KpiAssessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'KPI Assessment tidak ditemukan' });
    }

    // Hanya bisa diedit jika status draft atau rejected
    if (!['draft', 'rejected'].includes(assessment.status)) {
      return res.status(400).json({
        message: 'Assessment yang sudah disubmit/approved tidak bisa diedit',
      });
    }

    // Hanya pemilik yang bisa edit
    if (assessment.employee.toString() !== req.user.id && req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    const { scores } = req.body;
    if (scores && scores.length > 0) {
      // Ambil template untuk hitung skor
      const template = await KpiTemplate.findById(assessment.template);

      assessment.scores = scores.map((s) => {
        // Cari indikator dari template yang namanya sama
        const indicator = template.indicators.find(ind => ind.name === s.indicatorName);
        const weight = indicator ? indicator.weight : 0;
        const target = s.target !== undefined ? s.target : (indicator ? indicator.target : 0);
        const actual = s.actual !== undefined ? s.actual : 0;
        // Hitung score: (actual / target) * weight
        const score = target > 0 ? (actual / target) * weight : 0;

        return {
          indicatorName: s.indicatorName,
          target,
          actual,
          score: Math.round(score * 100) / 100,
        };
      });

      // Hitung total score
      assessment.totalScore = assessment.scores.reduce((sum, s) => sum + s.score, 0);
      assessment.totalScore = Math.round(assessment.totalScore * 100) / 100;
    }

    await assessment.save();

    res.json({
      message: 'KPI Assessment berhasil diupdate',
      assessment,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// SUBMIT — karyawan submit assessment
exports.submit = async (req, res) => {
  try {
    const assessment = await KpiAssessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'KPI Assessment tidak ditemukan' });
    }

    if (assessment.employee.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Hanya pemilik yang bisa submit' });
    }

    if (assessment.status !== 'draft' && assessment.status !== 'rejected') {
      return res.status(400).json({ message: 'Assessment sudah disubmit sebelumnya' });
    }

    assessment.status = 'submitted';
    assessment.submittedAt = new Date();
    await assessment.save();

    res.json({
      message: 'KPI Assessment berhasil disubmit',
      assessment,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// REVIEW — HR approve/reject assessment
exports.review = async (req, res) => {
  try {
    const { status, reviewNote } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status harus approved atau rejected' });
    }

    const assessment = await KpiAssessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'KPI Assessment tidak ditemukan' });
    }

    if (assessment.status !== 'submitted') {
      return res.status(400).json({ message: 'Hanya assessment yang sudah disubmit yang bisa direview' });
    }

    assessment.status = status;
    assessment.reviewedBy = req.user.id;
    assessment.reviewNote = reviewNote || '';
    assessment.reviewedAt = new Date();
    await assessment.save();

    res.json({
      message: `KPI Assessment berhasil di-${status}`,
      assessment,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
