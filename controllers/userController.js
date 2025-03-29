const User = require('../models/userModel');
const Bus = require('../models/Bus');
const Crew = require('../models/Crew');
const Schedule = require('../models/Schedule');
const bcrypt = require('bcrypt');

exports.getSignupPage = (req, res) => {
  res.render('signup', { name: '', email: '', error: '' });
};

exports.signupUser = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).render('signup', {
      error: 'Passwords do not match',
      name,
      email
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.redirect('/login');
  } catch (error) {
    console.error('Signup Error: ', error);
    if (error.code === 11000) {
      return res.status(400).render('signup', {
        error: 'Email already exists',
        name,
        email
      });
    }
    return res.status(500).render('signup', {
      error: 'Server Error, please try again later.',
      name,
      email
    });
  }
};

exports.getLoginPage = (req, res) => {
  res.render('login', { email: '', error: '' });
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).render('login', {
        error: 'Invalid email or password',
        email
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).render('login', {
        error: 'Invalid email or password',
        email
      });
    }

    req.session.user = user;
    res.redirect('/dashboard');
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

exports.getDashboardData = async (req, res) => {
  try {
    // Total number of buses
    const totalBuses = await Bus.countDocuments();

    // Total number of crew members
    const totalCrew = await Crew.countDocuments();

    // Get today's date at midnight for filtering schedules
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch active schedules for today where all crew members have accepted (no false in accepted array)
    const activeSchedules = await Schedule.find({
      scheduleDate: { $gte: today, $lte: today },
      accepted: { $nin: [false] }, // Exclude schedules where any crew declined
    }).populate('busId crewId');

    // Buses currently on duty (unique bus IDs from active schedules)
    const busesOnDuty = new Set(activeSchedules.map(schedule => schedule.busId?._id.toString())).size;

    // Crew currently on duty (unique crew IDs from active schedules)
    const onDutyCrew = new Set(activeSchedules.flatMap(schedule => schedule.crewId.map(c => c._id.toString()))).size;

    // Render the dashboard with all data
    res.render('dashboard', {
      totalBuses,
      totalCrew,
      busesOnDuty,
      onDutyCrew,
      activeRoutes: busesOnDuty // Assuming active routes = buses on duty for now; adjust if you have a Route model
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).send('Error loading dashboard');
  }
};

module.exports = exports;