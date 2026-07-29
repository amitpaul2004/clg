/**
 * ═══════════════════════════════════════════════════════
 *  CYBERPUNK BACKEND SERVER — server.js
 *  Express API + MongoDB (Mongoose) Authentication & Profile Storage
 * ═══════════════════════════════════════════════════════
 */

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const twilio = require('twilio');
const nodemailer = require('nodemailer');

// Helper to send real SMS via Twilio if configured
async function sendSMS(to, body) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
    try {
      const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      await client.messages.create({ body, from: TWILIO_PHONE_NUMBER, to });
      return true;
    } catch (error) {
      console.error('[TWILIO ERROR]', error.message);
      return false;
    }
  }
  return false;
}

// Helper to send real Email via Nodemailer if configured
async function sendEmail(to, subject, text) {
  const { SMTP_EMAIL, SMTP_PASSWORD } = process.env;
  if (SMTP_EMAIL && SMTP_PASSWORD) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail', // Standardizing on Gmail for simplicity
        auth: { user: SMTP_EMAIL, pass: SMTP_PASSWORD }
      });
      await transporter.sendMail({ from: SMTP_EMAIL, to, subject, text });
      return true;
    } catch (error) {
      console.error('[NODEMAILER ERROR]', error.message);
      return false;
    }
  }
  return false;
}

const app = express();
const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lmsuser:lms12345@cluster0.6dwomnu.mongodb.net/cybermarket';
const JWT_SECRET = process.env.JWT_SECRET || 'cyberpunk_neural_link_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── MongoDB Connection ─────────────────────────────────
let isMongoConnected = false;

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000
}).then(() => {
  isMongoConnected = true;
  console.log('⚡ [MONGODB] Connected to MongoDB database at:', MONGODB_URI);
}).catch(err => {
  isMongoConnected = false;
  console.warn('⚠️ [MONGODB] Local MongoDB service not detected (Running in Fallback Datastore Mode)');
});

// ── MongoDB User Schema ────────────────────────────────
const UserSchema = new mongoose.Schema({
  handle: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  displayName: { type: String, default: 'NEXUS_RUNNER' },
  bio: { type: String, default: 'Rogue netrunner. Data liberation specialist. The sprawl is my playground.' },
  location: { type: String, default: 'Neo-Tokyo, Sector 7G' },
  website: { type: String, default: 'https://nexus-runner.darknet.io' },
  notifications: {
    orderUpdates: { type: Boolean, default: true },
    priceDrops: { type: Boolean, default: true },
    newMessages: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false },
    channel: { type: String, default: 'email' },
    schedule: { type: String, default: 'realtime' }
  },
  security: {
    twoFactor: { type: Boolean, default: false },
    twoFactorMethod: { type: String, default: '' },
    twoFactorContact: { type: String, default: '' },
    tempOTP: { type: String, default: null },
    tempOTPExpires: { type: Date, default: null }
  },
  billing: {
    address: {
      street: { type: String, default: 'Block 7G, Neon Heights Tower' },
      city: { type: String, default: 'Neo-Tokyo' },
      zip: { type: String, default: 'NT-77042' }
    }
  },
  linkedAccounts: [{
    platform: { type: String, required: true },
    handle: { type: String, required: true },
    linkedAt: { type: Date, default: Date.now }
  }],
  activeSessions: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    device: { type: String, required: true },
    location: { type: String, required: true },
    ip: { type: String, required: true },
    lastActive: { type: Date, default: Date.now },
    isCurrent: { type: Boolean, default: false },
    icon: { type: String, default: 'monitor' } // monitor or smartphone
  }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// ── Fallback Memory Store (if MongoDB service isn't active) ──
const fallbackUsers = [];

// ── API ROUTES ─────────────────────────────────────────

// 1. Health Check & Database Status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    database: isMongoConnected ? 'MongoDB (Connected)' : 'Fallback Local Datastore',
    mongoUri: MONGODB_URI
  });
});

// 2. Register Endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { handle, email, password } = req.body;

    if (!handle || !email || !password) {
      return res.status(400).json({ error: 'All fields (handle, email, password) are required.' });
    }

    const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
    const passwordHash = await bcrypt.hash(password, 10);

    if (isMongoConnected) {
      // Check existing user in MongoDB
      const existing = await User.findOne({ $or: [{ email }, { handle: cleanHandle }] });
      if (existing) {
        return res.status(400).json({ error: 'Netrunner credentials already registered in database.' });
      }

      const newUser = new User({
        handle: cleanHandle,
        displayName: handle.replace(/^@/, '').toUpperCase(),
        email,
        passwordHash
      });

      await newUser.save();

      const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ message: 'Registration successful', token, user: newUser });
    } else {
      // Fallback in-memory registration
      const existing = fallbackUsers.find(u => u.email === email || u.handle === cleanHandle);
      if (existing) {
        return res.status(400).json({ error: 'Netrunner credentials already registered.' });
      }

      const newUser = {
        _id: 'fb_' + Date.now(),
        handle: cleanHandle,
        displayName: handle.replace(/^@/, '').toUpperCase(),
        email,
        passwordHash,
        bio: 'Rogue netrunner. Data liberation specialist. The sprawl is my playground.',
        location: 'Neo-Tokyo, Sector 7G',
        website: 'https://nexus-runner.darknet.io'
      };

      fallbackUsers.push(newUser);
      const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ message: 'Registration successful (Fallback Mode)', token, user: newUser });
    }
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ error: 'Server error during registration process.' });
  }
});

// 3. Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identity, password } = req.body;

    if (!identity || !password) {
      return res.status(400).json({ error: 'Identity (handle/email) and password required.' });
    }

    if (isMongoConnected) {
      const user = await User.findOne({
        $or: [{ email: identity }, { handle: identity }, { handle: `@${identity}` }]
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid netrunner identity or passkey.' });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid netrunner identity or passkey.' });
      }

      const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ message: 'Authentication successful', token, user });
    } else {
      // Fallback in-memory login
      let user = fallbackUsers.find(u => u.email === identity || u.handle === identity || u.handle === `@${identity}`);

      // Allow default login for demo user
      if (!user && (identity === 'nexus@darknet.io' || identity === 'NEXUS_RUNNER')) {
        const dummyHash = await bcrypt.hash('cyberpunk123', 10);
        user = {
          _id: 'fb_demo',
          handle: '@nexus_runner_77',
          displayName: 'NEXUS_RUNNER',
          email: 'nexus@darknet.io',
          passwordHash: dummyHash,
          bio: 'Rogue netrunner. Data liberation specialist.',
          location: 'Neo-Tokyo, Sector 7G',
          website: 'https://nexus-runner.darknet.io'
        };
        fallbackUsers.push(user);
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid netrunner identity or passkey.' });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid netrunner identity or passkey.' });
      }

      const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ message: 'Authentication successful (Fallback Mode)', token, user });
    }
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Server error during login process.' });
  }
});

// 4. Get Current Profile
app.get('/api/user/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authentication token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (isMongoConnected) {
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      // Inject mock active sessions if array is empty (for prototype purposes)
      if (!user.activeSessions || user.activeSessions.length === 0) {
        user.activeSessions = [
          { device: 'Chrome / Windows 11', location: 'Neo-Tokyo', ip: '192.168.1.144', isCurrent: true, icon: 'monitor' },
          { device: 'Firefox / Linux', location: 'Sector 9K', ip: '10.0.42.112', isCurrent: false, icon: 'monitor', lastActive: new Date(Date.now() - 3 * 60 * 60 * 1000) },
          { device: 'Mobile / Android', location: 'The Sprawl', ip: '172.16.0.45', isCurrent: false, icon: 'smartphone', lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        ];
        await user.save();
      }
      
      return res.json(user);
    } else {
      const user = fallbackUsers.find(u => u._id === decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json(user);
    }
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

// 5. Update Profile Information
app.put('/api/user/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const { displayName, email, location, website, bio } = req.body;

    if (isMongoConnected) {
      const user = await User.findByIdAndUpdate(
        decoded.id,
        { displayName, email, location, website, bio },
        { new: true }
      ).select('-passwordHash');
      return res.json({ message: 'Profile updated in MongoDB', user });
    } else {
      const user = fallbackUsers.find(u => u._id === decoded.id);
      if (user) {
        if (displayName) user.displayName = displayName;
        if (email) user.email = email;
        if (location) user.location = location;
        if (website) user.website = website;
        if (bio) user.bio = bio;
      }
      return res.json({ message: 'Profile updated', user });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 6. Update Security / Password
app.put('/api/user/password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Invalid password fields.' });
    }

    if (isMongoConnected) {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) return res.status(400).json({ error: 'Current password incorrect' });

      user.passwordHash = await bcrypt.hash(newPassword, 10);
      await user.save();
      return res.json({ message: 'Password updated successfully in MongoDB' });
    } else {
      const user = fallbackUsers.find(u => u._id === decoded.id);
      if (user) {
        user.passwordHash = await bcrypt.hash(newPassword, 10);
      }
      return res.json({ message: 'Password updated successfully' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// 6a. Update Security Settings
app.put('/api/user/security', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (isMongoConnected) {
      const user = await User.findByIdAndUpdate(
        decoded.id,
        { security: req.body },
        { new: true }
      ).select('-passwordHash');
      return res.json({ message: 'Security settings updated', security: user.security });
    } else {
      return res.json({ message: 'Security settings updated (fallback)', security: req.body });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update security settings' });
  }
});

// 6b. Send 2FA Verification OTP
app.post('/api/user/security/otp/send', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const { method, contact } = req.body;

    if (!method || !contact) {
      return res.status(400).json({ error: 'Method and contact are required.' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

    if (isMongoConnected) {
      await User.findByIdAndUpdate(decoded.id, {
        'security.tempOTP': otp,
        'security.tempOTPExpires': expires
      });
      
      let sentReal = false;
      const message = `Your Cyberpunk Nexus verification code is: ${otp}. It expires in 5 minutes.`;
      
      if (method === 'phone') {
        sentReal = await sendSMS(contact, message);
      } else if (method === 'email') {
        sentReal = await sendEmail(contact, 'Nexus Authentication Code', message);
      }
      
      if (sentReal) {
        console.log(`[REAL 2FA] Successfully sent OTP to ${contact} via ${method}`);
        return res.json({ message: 'Verification code sent.' });
      } else {
        console.log(`[SIMULATED 2FA] Sent OTP ${otp} to ${contact} via ${method} (Configure .env for real delivery)`);
        return res.json({ message: 'Verification code simulated in terminal.' });
      }
    } else {
      console.log(`[SIMULATED 2FA FALLBACK] Sent OTP ${otp} to ${contact} via ${method}`);
      return res.json({ message: 'Verification code simulated (fallback).' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// 6c. Verify 2FA OTP and Enable
app.post('/api/user/security/otp/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const { code, method, contact } = req.body;

    if (!code || !method || !contact) {
      return res.status(400).json({ error: 'Missing verification data.' });
    }

    if (isMongoConnected) {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      // In fallback mode, or if OTP is already expired/mismatched
      if (user.security.tempOTP !== code) {
        return res.status(400).json({ error: 'Invalid verification code.' });
      }
      
      if (user.security.tempOTPExpires < new Date()) {
        return res.status(400).json({ error: 'Verification code expired.' });
      }

      // Success, enable 2FA
      user.security.twoFactor = true;
      user.security.twoFactorMethod = method;
      user.security.twoFactorContact = contact;
      user.security.tempOTP = null;
      user.security.tempOTPExpires = null;
      await user.save();

      return res.json({ message: '2FA enabled successfully', security: user.security });
    } else {
      // In fallback mode, just assume success if a code is provided (mocking)
      return res.json({ 
        message: '2FA enabled (fallback)', 
        security: { twoFactor: true, twoFactorMethod: method, twoFactorContact: contact }
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// 7. Revoke Specific Session
app.delete('/api/user/sessions/:sessionId', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (isMongoConnected) {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      // Filter out the revoked session
      user.activeSessions = user.activeSessions.filter(s => s._id.toString() !== req.params.sessionId);
      await user.save();
      return res.json({ message: 'Session revoked successfully.', activeSessions: user.activeSessions });
    } else {
      return res.json({ message: 'Session revoked (fallback)' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to revoke session' });
  }
});

// 8. Revoke All Other Sessions
app.delete('/api/user/sessions', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (isMongoConnected) {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      // Keep only current session
      user.activeSessions = user.activeSessions.filter(s => s.isCurrent === true);
      await user.save();
      return res.json({ message: 'All other sessions revoked.', activeSessions: user.activeSessions });
    } else {
      return res.json({ message: 'Sessions revoked (fallback)' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to revoke sessions' });
  }
});

// 9. Update Notifications Preferences
app.put('/api/user/notifications', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (isMongoConnected) {
      const user = await User.findByIdAndUpdate(
        decoded.id,
        { notifications: req.body },
        { new: true }
      ).select('-passwordHash');
      return res.json({ message: 'Notifications updated in MongoDB', notifications: user.notifications });
    } else {
      return res.json({ message: 'Notifications updated', notifications: req.body });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// 8. Update Billing Address
app.put('/api/user/billing', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (isMongoConnected) {
      const user = await User.findByIdAndUpdate(
        decoded.id,
        { 'billing.address': req.body },
        { new: true }
      ).select('-passwordHash');
      return res.json({ message: 'Billing address updated in MongoDB', billing: user.billing });
    } else {
      return res.json({ message: 'Billing address updated', billing: req.body });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update billing address' });
  }
});

// 9. Link Account
app.post('/api/user/linked-accounts', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const { platform, handle } = req.body;

    if (!platform || !handle) {
      return res.status(400).json({ error: 'Platform and handle are required.' });
    }

    if (isMongoConnected) {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      // Check if already linked
      const exists = user.linkedAccounts.find(a => a.platform === platform && a.handle === handle);
      if (exists) return res.status(400).json({ error: 'Account already linked.' });

      user.linkedAccounts.push({ platform, handle });
      await user.save();
      return res.json({ message: 'Account linked', linkedAccounts: user.linkedAccounts });
    } else {
      return res.json({ message: 'Account linked (fallback)', linkedAccounts: [{ platform, handle }] });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to link account' });
  }
});

// 10. Unlink Account
app.delete('/api/user/linked-accounts/:platform', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const { platform } = req.params;
    const { handle } = req.query;

    if (isMongoConnected) {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      user.linkedAccounts = user.linkedAccounts.filter(
        a => !(a.platform === platform && (!handle || a.handle === handle))
      );
      await user.save();
      return res.json({ message: 'Account unlinked', linkedAccounts: user.linkedAccounts });
    } else {
      return res.json({ message: 'Account unlinked (fallback)', linkedAccounts: [] });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to unlink account' });
  }
});

// Serve HTML Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/profile.html', (req, res) => res.sendFile(path.join(__dirname, 'profile.html')));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Cyberpunk Application Server running at http://localhost:${PORT}`);
  console.log(`📡 Database mode: ${isMongoConnected ? 'MongoDB (Live)' : 'Local Datastore Fallback'}`);
});
