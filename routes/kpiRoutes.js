const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getEvaluations, saveEvaluations } = require('../controllers/kpiController');

router.use(protect);

router.get('/evaluations', getEvaluations);
router.post('/evaluations', saveEvaluations);

module.exports = router;
