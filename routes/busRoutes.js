const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');
const isAuthenticated = (req, res, next) => {
    if (!req.session.user) { 
      return res.redirect('/login'); 
    }
    next();
  };
 
router.post('/register-bus', busController.registerBus);
router.delete('/bus/:id',isAuthenticated, busController.deleteBus);
 
 
 
module.exports = router;
