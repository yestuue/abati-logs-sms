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
const crypto = require('crypto');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// ---- RATE LIMITERS ----
const generalLimiter = rateLimit({ windowMs: 15*60*1000, max: 100, message: 'Too many requests.' });
const authLimiter    = rateLimit({ windowMs: 15*60*1000, max: 10,  message: 'Too many auth attempts.' });

// ---- MIDDLEWARE ----
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(generalLimiter);

// ============================================================
// MONGODB
// ============================================================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err.message));

// ============================================================
// MODELS
// ============================================================

const userSchema = new mongoose.Schema({
  fullName:      { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:      { type: String, required: true, minlength: 8 },
  role:          { type: String, enum: ['user','admin'], default: 'user' },
  plan:          { type: String, enum: ['free','pro'], default: 'free' },
  planExpiresAt: { type: Date },
  isVerified:    { type: Boolean, default: false },
  createdAt:     { type: Date, default: Date.now },
  lastLogin:     { type: Date }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(p) {
  return await bcrypt.compare(p, this.password);
};

const User = mongoose.model('User', userSchema);

const transactionSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email:       { type: String, required: true },
  fullName:    { type: String },
  reference:   { type: String, required: true, unique: true },
  amount:      { type: Number, required: true },
  amountNaira: { type: Number, required: true },
  status:      { type: String, enum: ['pending','success','failed'], default: 'pending' },
  plan:        { type: String, default: 'pro' },
  channel:     { type: String },
  paidAt:      { type: Date },
  createdAt:   { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

const settingsSchema = new mongoose.Schema({
  key:       { type: String, required: true, unique: true },
  value:     { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now }
});

const Settings = mongoose.model('Settings', settingsSchema);

// ============================================================
// HELPERS
// ============================================================

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

function protect(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Please log in to access this.' });
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }
}

async function adminOnly(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    next();
  } catch {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function getSetting(key, defaultValue) {
  try {
    const s = await Settings.findOne({ key });
    return s ? s.value : defaultValue;
  } catch { return defaultValue; }
}

async function setSetting(key, value) {
  await Settings.findOneAndUpdate({ key }, { value, updatedAt: new Date() }, { upsert: true, new: true });
}

const otpStore = new Map();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// ============================================================
// MOCK NUMBERS
// ============================================================
const liveNumbers = [
  { id:1, number:'+234 812 345 6789', network:'MTN',     type:'mtn',     status:'Available' },
  { id:2, number:'+234 902 456 7890', network:'Airtel',  type:'airtel',  status:'Available' },
  { id:3, number:'+234 805 567 8901', network:'Glo',     type:'glo',     status:'Available' },
  { id:4, number:'+234 809 678 9012', network:'9Mobile', type:'9mobile', status:'Available' },
  { id:5, number:'+234 703 123 4567', network:'MTN',     type:'mtn',     status:'Available' },
  { id:6, number:'+234 802 234 5678', network:'Airtel',  type:'airtel',  status:'Available' },
  { id:7, number:'+234 915 345 6789', network:'Glo',     type:'glo',     status:'Available' },
  { id:8, number:'+234 818 456 7890', network:'9Mobile', type:'9mobile', status:'Available' }
];

// ============================================================
// PUBLIC ROUTES
// ============================================================

app.get('/api/v1/numbers', (req, res) => {
  const { network } = req.query;
  setTimeout(() => {
    if (network && network !== 'all') {
      return res.json({ success:true, data: liveNumbers.filter(n => n.type === network.toLowerCase()) });
    }
    res.json({ success:true, data: liveNumbers });
  }, 300);
});

app.post('/api/v1/waitlist', (req, res) => {
  const { email } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email))
    return res.status(400).json({ success:false, message:'Please provide a valid email address' });
  fs.appendFile(path.join(__dirname, 'waitlist.txt'), `${new Date().toISOString()} - ${email}\n`, err => {
    if (err) console.error('Error saving:', err);
  });
  res.status(201).json({ success:true, message:'Successfully added to waitlist!' });
});

// Public pricing endpoint
app.get('/api/v1/pricing', async (req, res) => {
  try {
    const priceNaira = await getSetting('pro_price_naira', 500);
    const proDays    = await getSetting('pro_duration_days', 30);
    const proPerks   = await getSetting('pro_perks', 'Private dedicated number · Instant SMS · 30-day retention · REST API Access · Priority Support');
    res.json({ success:true, priceNaira, proDays, proPerks });
  } catch {
    res.json({ success:true, priceNaira:500, proDays:30, proPerks:'' });
  }
});

// ============================================================
// AUTH ROUTES
// ============================================================

app.post('/api/v1/auth/register', authLimiter, async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password)
      return res.status(400).json({ success:false, message:'All fields are required.' });
    if (password.length < 8)
      return res.status(400).json({ success:false, message:'Password must be at least 8 characters.' });
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ success:false, message:'An account with this email already exists.' });
    const user = await User.create({ fullName, email, password });
    const token = generateToken(user._id);
    console.log(`[Register] New user: ${email}`);
    res.status(201).json({
      success:true, message:'Account created successfully!', token,
      user:{ id:user._id, fullName:user.fullName, email:user.email, plan:user.plan, role:user.role }
    });
  } catch (err) {
    console.error('[Register Error]', err.message);
    res.status(500).json({ success:false, message:'Server error. Please try again.' });
  }
});

app.post('/api/v1/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success:false, message:'Email and password are required.' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success:false, message:'Invalid email or password.' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success:false, message:'Invalid email or password.' });
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave:false });
    const token = generateToken(user._id);
    console.log(`[Login] User: ${email}`);
    res.json({
      success:true, message:'Login successful!', token,
      user:{ id:user._id, fullName:user.fullName, email:user.email, plan:user.plan, role:user.role }
    });
  } catch (err) {
    console.error('[Login Error]', err.message);
    res.status(500).json({ success:false, message:'Server error. Please try again.' });
  }
});

app.get('/api/v1/auth/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ success:false, message:'User not found.' });
    res.json({ success:true, user });
  } catch { res.status(500).json({ success:false, message:'Server error.' }); }
});

app.post('/api/v1/auth/forgot-password', authLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success:false, message:'Email is required.' });
  const user = await User.findOne({ email });
  if (user) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp, expires: Date.now() + 10*60*1000, verified:false });
    try {
      await transporter.sendMail({
        from:`"ABATI LOGS & SMS" <${process.env.EMAIL_USER}>`, to:email,
        subject:'Your ABATI Password Reset Code',
        html:`<div style="font-family:Arial;background:#1A1A1A;padding:40px;color:#fff;">
          <h2>ABATI LOGS & SMS</h2><p>Your password reset code:</p>
          <div style="font-size:2rem;font-weight:bold;color:#00E5A0;letter-spacing:8px;padding:20px;background:rgba(0,229,160,0.1);border-radius:8px;text-align:center;">${otp}</div>
          <p style="color:#999;margin-top:16px;">Expires in 10 minutes. Never share this code.</p>
        </div>`
      });
    } catch (err) { console.error('[Email Error]', err.message); }
  }
  res.json({ success:true, message:'If an account exists, a reset code has been sent.' });
});

app.post('/api/v1/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ success:false, message:'Email and OTP required.' });
  const record = otpStore.get(email);
  if (!record) return res.status(400).json({ success:false, message:'No reset request found.' });
  if (Date.now() > record.expires) { otpStore.delete(email); return res.status(400).json({ success:false, message:'Code expired.' }); }
  if (record.otp !== otp) return res.status(400).json({ success:false, message:'Invalid code.' });
  record.verified = true;
  otpStore.set(email, record);
  res.json({ success:true, message:'Code verified.' });
});

app.post('/api/v1/auth/reset-password', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success:false, message:'Email and password required.' });
  const record = otpStore.get(email);
  if (!record || !record.verified) return res.status(400).json({ success:false, message:'Please verify your OTP first.' });
  if (password.length < 8) return res.status(400).json({ success:false, message:'Password must be at least 8 characters.' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success:false, message:'User not found.' });
    user.password = password;
    await user.save();
    otpStore.delete(email);
    res.json({ success:true, message:'Password reset successfully.' });
  } catch { res.status(500).json({ success:false, message:'Server error.' }); }
});

// ============================================================
// USER ROUTES
// ============================================================

app.get('/api/v1/user/dashboard', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ success:false, message:'User not found.' });
    let daysRemaining = 0;
    if (user.plan === 'pro' && user.planExpiresAt) {
      daysRemaining = Math.max(0, Math.ceil((user.planExpiresAt - new Date()) / (1000*60*60*24)));
    }
    res.json({
      success:true, user,
      stats:{ virtualNumbers: user.plan==='pro'?1:0, smsReceived:0, totalSpent:0, daysRemaining }
    });
  } catch { res.status(500).json({ success:false, message:'Server error.' }); }
});

app.get('/api/v1/user/transactions', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId:req.userId }).sort({ createdAt:-1 });
    res.json({ success:true, data:transactions });
  } catch { res.status(500).json({ success:false, message:'Server error.' }); }
});

// ============================================================
// PAYMENT ROUTES
// ============================================================

app.post('/api/v1/payments/initialize', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ success:false, message:'User not found.' });
    const priceNaira = await getSetting('pro_price_naira', 500);
    const proDays    = await getSetting('pro_duration_days', 30);
    const reference  = 'ABATI_' + Date.now() + '_' + Math.random().toString(36).substring(2,8).toUpperCase();
    await Transaction.create({
      userId:user._id, email:user.email, fullName:user.fullName,
      reference, amount:priceNaira*100, amountNaira:priceNaira, status:'pending', plan:'pro'
    });
    res.json({
      success:true, reference, email:user.email,
      amount:priceNaira*100, priceNaira, proDays,
      publicKey:process.env.PAYSTACK_PUBLIC_KEY
    });
  } catch (err) {
    console.error('[Payment Init Error]', err.message);
    res.status(500).json({ success:false, message:'Could not initialize payment.' });
  }
});

app.post('/api/v1/payments/verify', protect, async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ success:false, message:'Reference required.' });

    const paystackRes  = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers:{ 'Authorization':`Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== 'success') {
      await Transaction.findOneAndUpdate({ reference }, { status:'failed' });
      return res.status(400).json({ success:false, message:'Payment not successful.' });
    }

    const proDays  = await getSetting('pro_duration_days', 30);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + proDays);

    await User.findByIdAndUpdate(req.userId, { plan:'pro', planExpiresAt:expiresAt });
    await Transaction.findOneAndUpdate({ reference }, {
      status:'success', channel:paystackData.data.channel, paidAt:new Date(paystackData.data.paid_at)
    });

    console.log(`[Payment] Pro upgrade: ${paystackData.data.customer.email}`);

    try {
      await transporter.sendMail({
        from:`"ABATI LOGS & SMS" <${process.env.EMAIL_USER}>`,
        to:paystackData.data.customer.email,
        subject:"🎉 You're now ABATI Pro!",
        html:`<div style="font-family:Arial;background:#1A1A1A;padding:40px;color:#fff;max-width:500px">
          <h2 style="color:#00E5A0">ABATI LOGS & SMS</h2>
          <h3>Your Pro plan is live! 🚀</h3>
          <p style="color:#ccc">You now have full access to everything Pro:</p>
          <ul style="color:#ccc;line-height:2.2;padding-left:20px">
            <li>✅ Private dedicated Nigerian number — yours alone</li>
            <li>✅ Instant SMS delivery directly to your dashboard</li>
            <li>✅ ${proDays}-day exclusive number retention</li>
            <li>✅ Full REST API access for automation</li>
            <li>✅ Priority support — we've got your back</li>
          </ul>
          <p style="color:#555;margin-top:24px;font-size:.82rem">Amount: ₦${paystackData.data.amount/100} · Ref: ${reference}</p>
          <a href="https://abati-logs-sms.onrender.com/dashboard.html"
             style="display:inline-block;margin-top:20px;padding:12px 28px;background:#00E5A0;color:#111;border-radius:8px;text-decoration:none;font-weight:700">
            Open Dashboard →
          </a>
        </div>`
      });
    } catch (emailErr) { console.error('[Email Error]', emailErr.message); }

    res.json({ success:true, message:'Payment verified! You are now Pro.', expiresAt });
  } catch (err) {
    console.error('[Payment Verify Error]', err.message);
    res.status(500).json({ success:false, message:'Server error during verification.' });
  }
});

// Paystack webhook
app.post('/api/v1/payments/webhook', async (req, res) => {
  try {
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(req.body).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) return res.status(400).send('Invalid signature');
    const event = JSON.parse(req.body.toString());
    if (event.event === 'charge.success') {
      const tx = await Transaction.findOne({ reference:event.data.reference });
      if (tx && tx.status !== 'success') {
        const proDays  = await getSetting('pro_duration_days', 30);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + proDays);
        await User.findByIdAndUpdate(tx.userId, { plan:'pro', planExpiresAt:expiresAt });
        await Transaction.findOneAndUpdate({ reference:event.data.reference }, {
          status:'success', channel:event.data.channel, paidAt:new Date(event.data.paid_at)
        });
        console.log(`[Webhook] Auto Pro upgrade: ${tx.email}`);
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('[Webhook Error]', err.message);
    res.sendStatus(200);
  }
});

// ============================================================
// ADMIN ROUTES
// ============================================================

app.get('/api/v1/admin/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt:-1 });
    res.json({ success:true, data:users, total:users.length });
  } catch { res.status(500).json({ success:false, message:'Server error.' }); }
});

app.delete('/api/v1/admin/users/:id', protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success:true, message:'User deleted.' });
  } catch { res.status(500).json({ success:false, message:'Server error.' }); }
});

app.patch('/api/v1/admin/users/:id/plan', protect, adminOnly, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['free','pro'].includes(plan))
      return res.status(400).json({ success:false, message:'Invalid plan.' });
    const update = { plan };
    if (plan === 'pro') {
      const proDays  = await getSetting('pro_duration_days', 30);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + proDays);
      update.planExpiresAt = expiresAt;
    } else {
      update.planExpiresAt = null;
    }
    await User.findByIdAndUpdate(req.params.id, update);
    res.json({ success:true, message:`User plan updated to ${plan}.` });
  } catch { res.status(500).json({ success:false, message:'Server error.' }); }
});

app.get('/api/v1/admin/stats', protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const proUsers   = await User.countDocuments({ plan:'pro' });
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const newToday   = await User.countDocuments({ createdAt:{ $gte:todayStart } });
    const revenueAgg = await Transaction.aggregate([
      { $match:{ status:'success' } },
      { $group:{ _id:null, total:{ $sum:'$amountNaira' } } }
    ]);
    res.json({ success:true, stats:{
      totalUsers, proUsers, freeUsers:totalUsers-proUsers, newToday,
      totalRevenue: revenueAgg[0]?.total || 0
    }});
  } catch { res.status(500).json({ success:false, message:'Server error.' }); }
});

app.get('/api/v1/admin/transactions', protect, adminOnly, async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt:-1 }).limit(200);
    res.json({ success:true, data:transactions });
  } catch { res.status(500).json({ success:false, message:'Server error.' }); }
});

app.get('/api/v1/admin/settings', protect, adminOnly, async (req, res) => {
  try {
    const priceNaira = await getSetting('pro_price_naira', 500);
    const proDays    = await getSetting('pro_duration_days', 30);
    const proPerks   = await getSetting('pro_perks', 'Private dedicated number · Instant SMS · 30-day retention · REST API Access · Priority Support');
    res.json({ success:true, settings:{ priceNaira, proDays, proPerks } });
  } catch { res.status(500).json({ success:false, message:'Server error.' }); }
});

app.post('/api/v1/admin/settings', protect, adminOnly, async (req, res) => {
  try {
    const { priceNaira, proDays, proPerks } = req.body;
    if (priceNaira !== undefined) await setSetting('pro_price_naira', Number(priceNaira));
    if (proDays    !== undefined) await setSetting('pro_duration_days', Number(proDays));
    if (proPerks   !== undefined) await setSetting('pro_perks', proPerks);
    res.json({ success:true, message:'Settings updated successfully.' });
  } catch { res.status(500).json({ success:false, message:'Server error.' }); }
});

app.get('/api/v1/admin/waitlist/stats', protect, adminOnly, async (req, res) => {
  try {
    const data  = await fsPromises.readFile(path.join(__dirname, 'waitlist.txt'), 'utf8');
    const lines = data.trim().split('\n').filter(l => l.trim());
    const signups = lines.map(line => {
      const i = line.indexOf(' - ');
      return { timestamp:line.substring(0,i), email:line.substring(i+3) };
    });
    res.json({ success:true, total:signups.length, latest:signups.slice(-5).reverse(), signups });
  } catch { res.json({ success:true, total:0, latest:[], signups:[] }); }
});

app.get('/api/v1/admin/waitlist', protect, adminOnly, async (req, res) => {
  try {
    const data = await fsPromises.readFile(path.join(__dirname, 'waitlist.txt'), 'utf8');
    res.json({ success:true, data });
  } catch { res.json({ success:true, data:'(no waitlist entries yet)' }); }
});

// ============================================================
// FALLBACK
// ============================================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`ABATI LOGS & SMS Backend Server`);
  console.log(`Running on http://localhost:${PORT}`);
  console.log(`=================================`);
});