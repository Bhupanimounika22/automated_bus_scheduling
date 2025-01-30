const express = require('express');
const router = express.Router(); // Use router, not app directly
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
 

 
// Dashboard Route
router.get('/dashboard', isAuthenticated, (req, res) => {
  res.render('dashboard'); // Render dashboard.ejs
});
 
router.get('/dashboard/routes', isAuthenticated, (req, res) => {
  res.render('routeManagement'); // Render realTimeMonitoring.ejs
});

 
 
// Real-time Monitoring Page
router.get('/dashboard/real-time', isAuthenticated, (req, res) => {
  res.render('realTimeMonitoring'); // Render realTimeMonitoring.ejs
});

// Analytics Page
router.get('/dashboard/analytics', isAuthenticated, (req, res) => {
  res.render('analytics'); // Render analytics.ejs
});

// Settings Page
router.get('/dashboard/settings', isAuthenticated, (req, res) => {
  res.render('settings'); // Render settings.ejs
});

module.exports = router;
