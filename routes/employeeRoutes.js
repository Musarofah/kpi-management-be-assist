const express = require('express');
const router = express.Router();
const { protect, hrOnly } = require('../middleware/auth');
const { getAll, create, update } = require('../controllers/employeeController');

router.use(protect);

router.get('/', getAll);
router.post('/', hrOnly, create);
router.put('/:id', hrOnly, update);
router.patch('/:id', hrOnly, update);

module.exports = router;

