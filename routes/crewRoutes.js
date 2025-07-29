 
const express = require('express');
const router = express.Router();
const crewController = require('../controllers/crewController');  // Correct import

 // Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) { 
    return res.redirect('/login'); 
  }
  next();
};
router.post('/register-crew', crewController.registerCrew);

// Route for managing crew
router.get('/dashboard/crew', isAuthenticated, crewController.getCrewList);
router.get('/dashboard/edit-crew/:id', isAuthenticated, crewController.getEditCrewPage);
router.delete('/crew/:id', isAuthenticated, crewController.deleteCrew);

// Update crew details
router.put('/crew/:crewId', isAuthenticated, crewController.updateCrew);

module.exports = router;
