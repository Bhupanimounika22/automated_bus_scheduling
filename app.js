const express = require('express');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const crewRoutes = require('./routes/crewRoutes');
const busRoutes = require('./routes/busRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes'); // Import schedule routes
const routeMangement=require('./routes/routes');
const session = require('express-session');
const path = require('path');
const settingsRoutes = require('./routes/adminRoutes'); // Adjust the path if needed
 

require('dotenv').config();

const app = express();

// Set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));


// Use session middleware
app.use(session({
  secret: 'mykey',
  resave: false,
  saveUninitialized: true
}));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Database connection
connectDB();

// Routes
app.use('/', userRoutes);
app.use('/', crewRoutes);
app.use('/', busRoutes);
app.use('/dashboard', scheduleRoutes);  
app.use('/dashboard',routeMangement);
 
app.use('/settings',settingsRoutes);


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
