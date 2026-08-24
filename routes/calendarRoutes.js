const express = require('express');
const router = express.Router();
const { protect, hrOnly } = require('../middleware/auth');
const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require('../controllers/calendarController');

// Semua route butuh login
router.use(protect);

router.get('/', getAll);
router.get('/:id', getById);

// Hanya HR yang bisa menambah, mengubah, atau menghapus event kalender
router.post('/', hrOnly, create);
router.put('/:id', hrOnly, update);
router.delete('/:id', hrOnly, remove);

module.exports = router;
