require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const fsPromises = require('fs').promises;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();
app.set('trust proxy', 1); // ✅ Required for Render / reverse proxies
const PORT = process.env.PORT || 3000;

// ---- RATE LIMITERS ----
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many auth attempts, please try again later.'
});

// ---- MIDDLEWARE ----
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(generalLimiter);

// ============================================================
// MONGODB CONNECTION
// ============================================================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err.message));

// ============================================================
// MONGOOSE MODELS
// ============================================================

const userSchema = new mongoose.Schema({
  fullName:   { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true, minlength: 8 },
  role:       { type: String, enum: ['user', 'admin'], default: 'user' },
  plan:       { type: String, enum: ['free', 'pro'], default: 'free' },
  isVerified: { type: Boolean, default: false },
  createdAt:  { type: Date, default: Date.now },
  lastLogin:  { type: Date }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// ============================================================
// HELPERS
// ============================================================

function generateToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function protect(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Please log in to access this.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }
}

async function adminOnly(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}

const otpStore = new Map();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ============================================================
// MOCK NUMBER DATABASE
// ============================================================
const liveNumbers = [
  { id: 1, number: '+234 812 345 6789', network: 'MTN',     type: 'mtn',     status: 'Available' },
  { id: 2, number: '+234 902 456 7890', network: 'Airtel',  type: 'airtel',  status: 'Available' },
  { id: 3, number: '+234 805 567 8901', network: 'Glo',     type: 'glo',     status: 'Available' },
  { id: 4, number: '+234 809 678 9012', network: '9Mobile', type: '9mobile', status: 'Available' },
  { id: 5, number: '+234 703 123 4567', network: 'MTN',     type: 'mtn',     status: 'Available' },
  { id: 6, number: '+234 802 234 5678', network: 'Airtel',  type: 'airtel',  status: 'Available' },
  { id: 7, number: '+234 915 345 6789', network: 'Glo',     type: 'glo',     status: 'Available' },
  { id: 8, number: '+234 818 456 7890', network: '9Mobile', type: '9mobile', status: 'Available' }
];

// ============================================================
// PUBLIC API ROUTES
// ============================================================

app.get('/api/v1/numbers', (req, res) => {
  const { network } = req.query;
  setTimeout(() => {
    if (network && network !== 'all') {
      const filtered = liveNumbers.filter(n => n.type === network.toLowerCase());
      return res.json({ success: true, data: filtered });
    }
    res.json({ success: true, data: liveNumbers });
  }, 300);
});

app.post('/api/v1/waitlist', (req, res) => {
  const { email } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
  }
  fs.appendFile(path.join(__dirname, 'waitlist.txt'), `${new Date().toISOString()} - ${email}\n`, err => {
    if (err) console.error('Error saving:', err);
  });
  console.log(`New waitlist signup: ${email}`);
  res.status(201).json({ success: true, message: 'Successfully added to waitlist!' });
});

// ============================================================
// AUTH ROUTES
// ============================================================

// REGISTER
app.post('/api/v1/auth/register', authLimiter, async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });

    const user = await User.create({ fullName, email, password });
    const token = generateToken(user._id);

    console.log(`[Register] New user: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, plan: user.plan, role: user.role }
    });
  } catch (err) {
    console.error('[Register Error]', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// LOGIN
app.post('/api/v1/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    console.log(`[Login] User: ${email}`);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, plan: user.plan, role: user.role }
    });
  } catch (err) {
    console.error('[Login Error]', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// GET CURRENT USER
app.get('/api/v1/auth/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// FORGOT PASSWORD
app.post('/api/v1/auth/forgot-password', authLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

  const user = await User.findOne({ email });
  if (user) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp, expires: Date.now() + 10 * 60 * 1000, verified: false });
    console.log(`[OTP] ${email}: ${otp}`);

    try {
      await transporter.sendMail({
        from: `"ABATI LOGS & SMS" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your ABATI Password Reset Code',
        html: `<div style="font-family:Arial;background:#1A1A1A;padding:40px;color:#fff;">
          <h2>ABATI LOGS & SMS</h2>
          <p>Your password reset code:</p>
          <div style="font-size:2rem;font-weight:bold;color:#00E5A0;letter-spacing:8px;padding:20px;background:rgba(0,229,160,0.1);border-radius:8px;text-align:center;">${otp}</div>
          <p style="color:#999;margin-top:16px;">Expires in 10 minutes. Never share this code.</p>
        </div>`
      });
    } catch (err) {
      console.error('[Email Error]', err.message);
    }
  }

  res.json({ success: true, message: 'If an account exists, a reset code has been sent.' });
});

// VERIFY OTP
app.post('/api/v1/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required.' });

  const record = otpStore.get(email);
  if (!record) return res.status(400).json({ success: false, message: 'No reset request found.' });
  if (Date.now() > record.expires) {
    otpStore.delete(email);
    return res.status(400).json({ success: false, message: 'Code expired. Request a new one.' });
  }
  if (record.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid code.' });

  record.verified = true;
  otpStore.set(email, record);
  res.json({ success: true, message: 'Code verified.' });
});

// RESET PASSWORD
app.post('/api/v1/auth/reset-password', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });

  const record = otpStore.get(email);
  if (!record || !record.verified) return res.status(400).json({ success: false, message: 'Please verify your OTP first.' });
  if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.password = password;
    await user.save();
    otpStore.delete(email);
    console.log(`[Password Reset] ${email}`);
    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ============================================================
// PROTECTED USER ROUTES
// ============================================================

app.get('/api/v1/user/dashboard', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({
      success: true,
      user,
      stats: {
        virtualNumbers: 0,
        smsReceived: 0,
        totalSpent: 0,
        daysRemaining: user.plan === 'pro' ? 30 : 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ============================================================
// ADMIN ROUTES
// ============================================================

app.get('/api/v1/admin/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users, total: users.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.delete('/api/v1/admin/users/:id', protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.get('/api/v1/admin/stats', protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const proUsers = await User.countDocuments({ plan: 'pro' });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const newToday = await User.countDocuments({ createdAt: { $gte: todayStart } });
    res.json({ success: true, stats: { totalUsers, proUsers, freeUsers: totalUsers - proUsers, newToday } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Admin waitlist stats
app.get('/api/v1/admin/waitlist/stats', protect, adminOnly, async (req, res) => {
  try {
    const data = await fsPromises.readFile(path.join(__dirname, 'waitlist.txt'), 'utf8');
    const lines = data.trim().split('\n').filter(line => line.trim() !== '');
    const signups = lines.map(line => {
      const dashIndex = line.indexOf(' - ');
      const timestamp = line.substring(0, dashIndex);
      const email = line.substring(dashIndex + 3);
      return { timestamp, email };
    });
    res.json({ success: true, total: signups.length, latest: signups.slice(-5).reverse(), signups });
  } catch (err) {
    res.json({ success: true, total: 0, latest: [], signups: [] });
  }
});

// Admin waitlist raw
app.get('/api/v1/admin/waitlist', protect, adminOnly, async (req, res) => {
  try {
    const data = await fsPromises.readFile(path.join(__dirname, 'waitlist.txt'), 'utf8');
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: true, data: '(no waitlist entries yet)' });
  }
});

// ============================================================
// FALLBACK ROUTE — must be last
// ============================================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---- START SERVER ----
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`ABATI LOGS & SMS Backend Server`);
  console.log(`Running on http://localhost:${PORT}`);
  console.log(`=================================`);
});