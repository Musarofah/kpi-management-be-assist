const CalendarEvent = require('../models/CalenderEvent');
const Task = require('../models/Task');
const User = require('../models/User');

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
      .populate('assignee', 'name')
      .populate('relatedTask', 'title status dueDate storyPoint')
      .sort({ date: 1 });

    const formattedEvents = events.map(event => {
      const d = new Date(event.date);
      return {
        id: event._id,
        _id: event._id,
        title: event.title,
        day: d.getDate(),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        category: event.category || 'Event',
        team: event.team || 'General',
        assignee: event.assignee ? event.assignee.name : 'Unassigned',
        status: event.status || 'Scheduled',
        color: event.color || 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
        description: event.description
      };
    });

    res.json({
      success: true,
      count: formattedEvents.length,
      data: formattedEvents,
      events: formattedEvents,
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
      .populate('assignee', 'name')
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
    const { title, description, date, endDate, eventType, status, team, relatedTask, day, month, year, category, assignee, color } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Judul event wajib diisi',
      });
    }

    if (!date && (!day || !month || !year)) {
      return res.status(400).json({
        success: false,
        message: 'Judul event dan tanggal wajib diisi',
      });
    }

    // Handle FE date format
    let eventDate = date ? new Date(date) : new Date();
    if (day && month && year) {
      eventDate = new Date(year, month - 1, day);
    }

    // Lookup assignee mapping
    let assignedUserId = null;
    if (assignee) {
      const foundUser = await User.findOne({ name: new RegExp(`^${assignee}$`, 'i') });
      if (foundUser) {
        assignedUserId = foundUser._id;
      }
    }

    const event = await CalendarEvent.create({
      title,
      description: description || '',
      date: eventDate,
      endDate: endDate ? new Date(endDate) : undefined,
      eventType: eventType || 'agenda',
      status: status || 'Scheduled',
      team: team || 'General',
      category: category || 'Event',
      color: color || 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      assignee: assignedUserId,
      relatedTask: relatedTask || undefined,
      createdBy: req.user ? req.user.id : undefined,
    });

    const populatedEvent = await CalendarEvent.findById(event._id)
      .populate('createdBy', 'name email role avatar')
      .populate('assignee', 'name')
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
    const { title, description, date, endDate, eventType, status, team, relatedTask, day, month, year, category, assignee, color } = req.body;

    const event = await CalendarEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event tidak ditemukan' });
    }

    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    
    if (day && month && year) {
      event.date = new Date(year, month - 1, day);
    } else if (date !== undefined) {
      event.date = new Date(date);
    }

    if (endDate !== undefined) event.endDate = endDate ? new Date(endDate) : undefined;
    if (eventType !== undefined) event.eventType = eventType;
    if (status !== undefined) event.status = status;
    if (team !== undefined) event.team = team;
    if (category !== undefined) event.category = category;
    if (color !== undefined) event.color = color;
    
    if (assignee) {
      const foundUser = await User.findOne({ name: new RegExp(`^${assignee}$`, 'i') });
      if (foundUser) {
        event.assignee = foundUser._id;
      }
    }

    if (relatedTask !== undefined) event.relatedTask = relatedTask || undefined;

    await event.save();

    const populatedEvent = await CalendarEvent.findById(event._id)
      .populate('createdBy', 'name email role avatar')
      .populate('assignee', 'name')
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
