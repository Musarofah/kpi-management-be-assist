const express = require('express');
const router = express.Router();
const { protect, hrOnly } = require('../middleware/auth');
const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require('../controllers/kpiTemplateController');

// Semua route butuh login
router.use(protect);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', hrOnly, create);
router.put('/:id', hrOnly, update);
router.delete('/:id', hrOnly, remove);

module.exports = router;
