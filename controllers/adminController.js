const bcrypt = require('bcrypt');
const User = require('../models/userModel'); 

exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;
 
    if (newPassword !== confirmPassword) {
        return res.status(400).render('settings', {
            error: 'New passwords do not match.',
        });
    }

    try {
 
        const user = await User.findById(req.session.user._id); 

        if (!user) {
            return res.status(404).render('settings', {
                error: 'User not found.',
            });
        }

 
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).render('settings', {
                error: 'Incorrect old password.',
            });
        }

        // Hash and update the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).render('settings', {
            success: 'Password changed successfully.',
        });
    } catch (error) {
        console.error('Password Change Error:', error);
        res.status(500).render('settings', {
            error: 'Server error. Please try again later.',
        });
    }
};
