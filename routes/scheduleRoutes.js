const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

const isAuthenticated = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

router.get('/schedule', isAuthenticated, scheduleController.getSchedules);
router.post('/schedule/auto-assign', isAuthenticated, scheduleController.autoAssignSchedules);
router.post('/schedule/edit/:id', isAuthenticated, scheduleController.editScheduleShift);
router.delete('/schedule/delete/:id', isAuthenticated, scheduleController.deleteSchedule);
router.get('/schedule/accept/:scheduleId/:crewId/:response', scheduleController.acceptSchedule);
router.get('/', isAuthenticated, scheduleController.getDashboardData); // Dashboard route

module.exports = router;