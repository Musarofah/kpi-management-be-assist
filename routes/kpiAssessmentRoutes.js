const express = require('express');
const router = express.Router();
const { protect, hrOnly } = require('../middleware/auth');
const {
  getAll,
  getById,
  create,
  update,
  submit,
  review,
} = require('../controllers/kpiAssessmentController');

// Semua route butuh login
router.use(protect);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id/submit', submit);
router.patch('/:id/review', hrOnly, review);

module.exports = router;
