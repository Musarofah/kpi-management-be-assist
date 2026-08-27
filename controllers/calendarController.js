const CalendarEvent = require('../models/CalenderEvent');
const Task = require('../models/Task');

// GET ALL EVENTS
exports.getAll = async (req, res) => {
  try {
    const filter = {};

    // Filter berdasarkan month & year (misal: ?month=8&year=2026)
    if (req.query.month && req.query.year) {
      const yr = parseInt(req.query.year, 10);
      const mo = parseInt(req.query.month, 10);
      const monthIndex = (mo >= 1 && mo <= 12) ? mo - 1 : mo;

      const startOfMonth = new Date(Date.UTC(yr, monthIndex, 1, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(yr, monthIndex + 1, 0, 23, 59, 59, 999));

      filter.date = {
        $gte: startOfMonth,
        $lte: endOfMonth,
      };
    } else if (req.query.start && req.query.end) {
      filter.date = {
        $gte: new Date(req.query.start),
        $lte: new Date(req.query.end),
      };
    } else if (req.query.date) {
      const targetDate = new Date(req.query.date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      filter.date = {
        $gte: targetDate,
        $lt: nextDay,
      };
    }

    if (req.query.team) {
      filter.team = req.query.team;
    }

    if (req.query.eventType) {
      filter.eventType = req.query.eventType;
    }

    const events = await CalendarEvent.find(filter)
      .populate('createdBy', 'name email role avatar')
      .populate('relatedTask', 'title status dueDate storyPoint')
      .sort({ date: 1 });

    res.json({
      success: true,
      count: events.length,
      data: events,
      events,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET EVENT BY ID
exports.getById = async (req, res) => {
  try {
    const event = await CalendarEvent.findById(req.params.id)
      .populate('createdBy', 'name email role avatar')
      .populate('relatedTask', 'title status dueDate storyPoint');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event tidak ditemukan' });
    }

    res.json({
      success: true,
      data: event,
      event,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE EVENT
exports.create = async (req, res) => {
  try {
    const { title, description, date, endDate, eventType, status, team, relatedTask } = req.body;

    if (!title || !date) {
      return res.status(400).json({
        success: false,
        message: 'Judul event dan tanggal wajib diisi',
      });
    }

    const event = await CalendarEvent.create({
      title,
      description: description || '',
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : undefined,
      eventType: eventType || 'agenda',
      status: status || 'Scheduled',
      team: team || 'General',
      relatedTask: relatedTask || undefined,
      createdBy: req.user ? req.user.id : undefined,
    });

    const populatedEvent = await CalendarEvent.findById(event._id)
      .populate('createdBy', 'name email role avatar')
      .populate('relatedTask', 'title status dueDate storyPoint');

    res.status(201).json({
      success: true,
      message: 'Event berhasil ditambahkan ke kalender',
      data: populatedEvent,
      event: populatedEvent,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE EVENT
exports.update = async (req, res) => {
  try {
    const { title, description, date, endDate, eventType, status, team, relatedTask } = req.body;

    const event = await CalendarEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event tidak ditemukan' });
    }

    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (date !== undefined) event.date = new Date(date);
    if (endDate !== undefined) event.endDate = endDate ? new Date(endDate) : undefined;
    if (eventType !== undefined) event.eventType = eventType;
    if (status !== undefined) event.status = status;
    if (team !== undefined) event.team = team;
    if (relatedTask !== undefined) event.relatedTask = relatedTask || undefined;

    await event.save();

    const populatedEvent = await CalendarEvent.findById(event._id)
      .populate('createdBy', 'name email role avatar')
      .populate('relatedTask', 'title status dueDate storyPoint');

    res.json({
      success: true,
      message: 'Event kalender berhasil diperbarui',
      data: populatedEvent,
      event: populatedEvent,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE EVENT
exports.remove = async (req, res) => {
  try {
    const event = await CalendarEvent.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event tidak ditemukan' });
    }

    res.json({
      success: true,
      message: 'Event kalender berhasil dihapus',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
