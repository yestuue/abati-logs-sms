require('dotenv').config();
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: String,
  role: String,
  password: String,
  fullName: String,
  plan: String,
  isVerified: Boolean,
  createdAt: Date,
  lastLogin: Date
});
const User = mongoose.model('User', userSchema);

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const result = await User.updateOne(
    { email: 'omobajohn970@gmail.com' },
    { $set: { role: 'admin' } }
  );
  console.log('Updated:', result.modifiedCount, 'user(s)');
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });