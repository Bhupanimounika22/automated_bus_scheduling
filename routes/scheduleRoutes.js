const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) { 
    return res.redirect('/login'); 
  }
  next();
};
 
// Get all schedules
router.get('/schedule', isAuthenticated,scheduleController.getSchedules);

// Auto assign schedules
router.get('/schedule/assign', scheduleController.autoAssignSchedules);

// Edit schedule shift
router.post('/schedule/edit/:id', scheduleController.editScheduleShift);

// Delete schedule
router.delete('/schedule/delete/:id', scheduleController.deleteSchedule);

module.exports = router;
