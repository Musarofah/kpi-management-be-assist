const express = require('express');
const router = express.Router();
const { protect, hrOnly } = require('../middleware/auth');
const {
  getAll,
  getById,
  create,
  update,
  updateStatus,
  remove,
  getHistory,
} = require('../controllers/taskController');

// Semua route butuh login
router.use(protect);

router.get('/', getAll);
router.get('/:id', getById);
router.get('/:id/history', getHistory);

// Hanya HR yang bisa melakukan CRUD penuh
router.post('/', hrOnly, create);
router.put('/:id', hrOnly, update);
router.delete('/:id', hrOnly, remove);

// Penerima tugas atau HR bisa memperbarui status tugas
router.patch('/:id/status', updateStatus);

module.exports = router;
