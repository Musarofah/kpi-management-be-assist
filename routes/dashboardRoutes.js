const express = require('express');
const router = express.Router();
const { protect, hrOnly } = require('../middleware/auth');
const {
  getStats,
  getSprintTasks,
  updateSprintTask,
  deleteSprintTask,
} = require('../controllers/dashboardController');

// All dashboard endpoints require login
router.use(protect);

router.get('/stats', getStats);
router.get('/tasks', getSprintTasks);
router.put('/tasks/:id', hrOnly, updateSprintTask);
router.delete('/tasks/:id', hrOnly, deleteSprintTask);

module.exports = router;
