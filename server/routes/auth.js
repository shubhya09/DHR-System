import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all users (Admin/Doctor view)
router.get('/all-users', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    const usersWithProfiles = await Promise.all(users.map(async (user) => {
      let profile;
      if (user.role === 'patient') {
        profile = await Patient.findOne({ userId: user._id });
      } else {
        profile = await Doctor.findOne({ userId: user._id });
      }
      return { ...user.toObject(), profile };
    }));
    res.json(usersWithProfiles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/register/patient', async (req, res) => {
  try {
    const { email, password, fullName, phone, age, gender } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({ email, password, role: 'patient' });
    await user.save();

    const patient = new Patient({ userId: user._id, fullName, phone, age, gender });
    await patient.save();

    res.status(201).json({ message: 'Patient registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/register/doctor', async (req, res) => {
  try {
    const { email, password, fullName, phone, specialization, experience, hospitalName, address } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({ email, password, role: 'doctor' });
    await user.save();

    const doctor = new Doctor({ 
      userId: user._id, 
      fullName, 
      phone, 
      specialization, 
      experience, 
      hospitalName,
      address: address || 'Not set'
    });
    await doctor.save();

    res.status(201).json({ message: 'Doctor registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    let profile;
    if (user.role === 'patient') {
      profile = await Patient.findOne({ userId: user._id });
    } else {
      profile = await Doctor.findOne({ userId: user._id });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, profileId: profile._id },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '1d' }
    );

    res.json({ token, user: { id: user._id, role: user.role, email: user.email, profile } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // In a real app, send email here. For this demo, we'll return the token.
    console.log(`Reset token for ${email}: ${token}`);
    res.json({ message: 'Reset token generated', token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Direct Password Reset (No token - for demo purposes)
router.post('/reset-password-direct', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = password;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
