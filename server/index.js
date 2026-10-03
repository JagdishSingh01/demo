import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './models/User.js';

const app = express();
const port = process.env.PORT || 4000;
const jwtSecret = process.env.JWT_SECRET || 'development-secret-change-me';

app.use(cors());
app.use(express.json());

const createToken = (user) => jwt.sign({ id: user._id.toString() }, jwtSecret, { expiresIn: '7d' });
const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email });

const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Authentication required.' });
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'Account not found.' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
};

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'harbor-auth' }));

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    if (password.length < 8) return res.status(400).json({ message: 'Use at least 8 characters for your password.' });
    const normalizedEmail = email.trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ message: 'An account with that email already exists.' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password: passwordHash });
    res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to create your account right now.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.trim().toLowerCase() }).select('+password');
    if (!user || !(await bcrypt.compare(password || '', user.password))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }
    res.json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to sign in right now.' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Something went wrong.' });
});

export { app };

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/harbor_auth');
    console.log('MongoDB connected. Users collection is ready.');
    app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

if (process.env.VERCEL !== '1') start();
