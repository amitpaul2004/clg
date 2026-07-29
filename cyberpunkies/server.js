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
    twoFactor: { type: Boolean, default: true }
  },
  billing: {
    address: {
      street: { type: String, default: 'Block 7G, Neon Heights Tower' },
      city: { type: String, default: 'Neo-Tokyo' },
      zip: { type: String, default: 'NT-77042' }
    }
  },
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

// 7. Update Notifications Preferences
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

// Serve HTML Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/profile.html', (req, res) => res.sendFile(path.join(__dirname, 'profile.html')));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Cyberpunk Application Server running at http://localhost:${PORT}`);
  console.log(`📡 Database mode: ${isMongoConnected ? 'MongoDB (Live)' : 'Local Datastore Fallback'}`);
});
