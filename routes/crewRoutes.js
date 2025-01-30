 
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


// Route for managing routes
router.get('/dashboard/crew', isAuthenticated, crewController.getCrewList);  // Correct usage
router.delete('/crew/:id', isAuthenticated, crewController.deleteCrew);

 // Update crew details
router.put('/crew/:crewId', isAuthenticated, crewController.updateCrew);

module.exports = router;
