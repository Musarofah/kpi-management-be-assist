const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require('../controllers/calendarController');

// All calendar routes require login
router.use(protect);

// Support both /api/calendar/events and /api/calendar
router.get('/events', getAll);
router.post('/events', create);
router.get('/events/:id', getById);
router.put('/events/:id', update);
router.delete('/events/:id', remove);

// Root aliases
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
