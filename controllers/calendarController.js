const CalendarEvent = require('../models/CalenderEvent');

// GET ALL EVENTS
exports.getAll = async (req, res) => {
  try {
    const filter = {};

    // Filter berdasarkan range tanggal (misal untuk kalender bulanan/mingguan)
    if (req.query.start && req.query.end) {
      filter.date = {
        $gte: new Date(req.query.start),
        $lte: new Date(req.query.end),
      };
    } else if (req.query.date) {
      // Filter tanggal spesifik
      const targetDate = new Date(req.query.date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      filter.date = {
        $gte: targetDate,
        $lt: nextDay,
      };
    }

    // Filter berdasarkan team
    if (req.query.team) {
      filter.team = req.query.team;
    }

    // Filter berdasarkan type event
    if (req.query.eventType) {
      filter.eventType = req.query.eventType;
    }

    const events = await CalendarEvent.find(filter)
      .populate('createdBy', 'name email role')
      .populate('relatedTask', 'title status dueDate')
      .sort({ date: 1 });

    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET EVENT BY ID
exports.getById = async (req, res) => {
  try {
    const event = await CalendarEvent.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('relatedTask', 'title status dueDate');

    if (!event) {
      return res.status(404).json({ message: 'Event tidak ditemukan' });
    }

    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE EVENT (HR Only)
exports.create = async (req, res) => {
  try {
    const { title, date, eventType, status, team, relatedTask } = req.body;

    if (!title || !date) {
      return res.status(400).json({ message: 'Judul event dan tanggal wajib diisi' });
    }

    const event = await CalendarEvent.create({
      title,
      date,
      eventType,
      status: status || 'Scheduled',
      team,
      relatedTask: relatedTask || undefined,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: 'Event berhasil dibuat di kalender',
      event,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE EVENT (HR Only)
exports.update = async (req, res) => {
  try {
    const { title, date, eventType, status, team, relatedTask } = req.body;

    const event = await CalendarEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event tidak ditemukan' });
    }

    if (title !== undefined) event.title = title;
    if (date !== undefined) event.date = date;
    if (eventType !== undefined) event.eventType = eventType;
    if (status !== undefined) event.status = status;
    if (team !== undefined) event.team = team;
    if (relatedTask !== undefined) event.relatedTask = relatedTask || undefined;

    await event.save();

    res.json({
      message: 'Event kalender berhasil diperbarui',
      event,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE EVENT (HR Only)
exports.remove = async (req, res) => {
  try {
    const event = await CalendarEvent.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event tidak ditemukan' });
    }

    res.json({ message: 'Event kalender berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
