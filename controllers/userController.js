const User = require('../models/userModel');
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

    // Set session
    req.session.user = user;

    // Redirect to dashboard
    res.redirect('/dashboard');
  } catch (error) {
    res.status(500).send('Server Error');
  }
};
exports.dashboardCrew=async(req,res)=>{
  res.render('crewmanagement');


}