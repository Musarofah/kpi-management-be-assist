const express = require('express');
const router = express.Router();
const { protect, hrOnly } = require('../middleware/auth');
const {
  getAll,
  getById,
  create,
  update,
  updateStatus,
  updateStoryPoint,
  rejectQA,
  remove,
  getHistory,
} = require('../controllers/taskController');

// All routes require login
router.use(protect);

router.get('/', getAll);
router.get('/:id', getById);
router.get('/:id/history', getHistory);

router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

// Kanban workflows
router.patch('/:id/status', updateStatus);
router.patch('/:id/point', updateStoryPoint);
router.post('/:id/reject', rejectQA);


module.exports = router;
