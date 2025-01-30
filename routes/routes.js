const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');

// API endpoints
const isAuthenticated = (req, res, next) => {
    if (!req.session.user) { 
      return res.redirect('/login'); 
    }
    next();
  };
router.get('/real-time', isAuthenticated, (req, res) => {
    res.render('realTimeMonitoring'); // Render realTimeMonitoring.ejs
  });
router.post('/add', routeController.addRoute);
router.get('/', routeController.getRoutes);

module.exports = router;
