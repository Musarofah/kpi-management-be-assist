const KpiTemplate = require('../models/KpiTemplate');

// GET ALL — list semua template, bisa filter by department
exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) {
      filter.department = req.query.department;
    }
    if (req.query.period) {
      filter.period = req.query.period;
    }

    const templates = await KpiTemplate.find(filter)
      .populate('department', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const formattedTemplates = templates.map(t => {
      return {
        id: t._id,
        _id: t._id,
        name: t.name,
        role: t.role,
        department: t.department ? t.department.name : 'Unknown',
        indicatorsCount: t.indicators ? t.indicators.length : 0,
        indicators: t.indicators || [],
      };
    });

    res.json({
      success: true,
      data: formattedTemplates,
      templates: formattedTemplates,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET BY ID — detail template
exports.getById = async (req, res) => {
  try {
    const template = await KpiTemplate.findById(req.params.id)
      .populate('department', 'name')
      .populate('createdBy', 'name email');

    if (!template) {
      return res.status(404).json({ success: false, message: 'KPI Template tidak ditemukan' });
    }

    res.json({
      success: true,
      data: {
        id: template._id,
        _id: template._id,
        name: template.name,
        role: template.role,
        department: template.department ? template.department.name : 'Unknown',
        indicatorsCount: template.indicators ? template.indicators.length : 0,
        indicators: template.indicators || [],
      },
      template,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE — buat template baru (HR only)
exports.create = async (req, res) => {
  try {
    const { name, department, period, indicators } = req.body;

    if (!name || !period) {
      return res.status(400).json({ message: 'Nama dan period wajib diisi' });
    }

    if (!indicators || indicators.length === 0) {
      return res.status(400).json({ message: 'Minimal 1 indikator harus diisi' });
    }

    // Validasi total weight harus 100%
    const totalWeight = indicators.reduce((sum, ind) => sum + (Number(ind.weight) || 0), 0);
    if (totalWeight !== 100) {
      return res.status(400).json({
        message: `Total bobot harus 100%, sekarang ${totalWeight}%`,
      });
    }

    const template = await KpiTemplate.create({
      name,
      department,
      period,
      indicators,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: 'KPI Template berhasil dibuat',
      template,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE — update template (HR only)
exports.update = async (req, res) => {
  try {
    const { name, department, period, indicators } = req.body;

    // Validasi total weight jika indicators diubah
    if (indicators && indicators.length > 0) {
      const totalWeight = indicators.reduce((sum, ind) => sum + (Number(ind.weight) || 0), 0);
      if (totalWeight !== 100) {
        return res.status(400).json({
          message: `Total bobot harus 100%, sekarang ${totalWeight}%`,
        });
      }
    }

    const template = await KpiTemplate.findByIdAndUpdate(
      req.params.id,
      { name, department, period, indicators },
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({ message: 'KPI Template tidak ditemukan' });
    }

    res.json({
      message: 'KPI Template berhasil diupdate',
      template,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE — hapus template (HR only)
exports.remove = async (req, res) => {
  try {
    const template = await KpiTemplate.findByIdAndDelete(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'KPI Template tidak ditemukan' });
    }

    res.json({ message: 'KPI Template berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
