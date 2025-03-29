const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Render signup page
router.get('/signup', userController.getSignupPage);

// Handle user signup
router.post('/signup', userController.signupUser);

// Render login page
router.get('/login', userController.getLoginPage);

// Handle user login
router.post('/login', userController.loginUser);

// Middleware for checking if user is logged in
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// Dashboard Route (single definition)
router.get('/dashboard', isAuthenticated, userController.getDashboardData);

// Additional dashboard routes
router.get('/dashboard/routes', isAuthenticated, (req, res) => {
  res.render('routeManagement');
});

router.get('/dashboard/real-time', isAuthenticated, (req, res) => {
  res.render('realTimeMonitoring');
});

router.get('/dashboard/analytics', isAuthenticated, (req, res) => {
  res.render('analytics');
});

router.get('/dashboard/settings', isAuthenticated, (req, res) => {
  res.render('settings');
});

module.exports = router;