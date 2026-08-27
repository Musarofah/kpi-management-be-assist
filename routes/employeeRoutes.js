const express = require('express');
const router = express.Router();
const { protect, hrOnly } = require('../middleware/auth');
const { getAll, create } = require('../controllers/employeeController');

router.use(protect);

router.get('/', getAll);
router.post('/', hrOnly, create);

module.exports = router;
