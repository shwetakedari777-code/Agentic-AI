const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

const BCRYPT_ROUNDS = 12;

class AuthService {
  generateToken(user) {
    const payload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
  }

  formatUser(user) {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };
  }

  async register({ name, email, password, role = 'operator' }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      const err = new Error('An account with this email address already exists');
      err.statusCode = 400;
      err.code = 'USER_EXISTS';
      throw err;
    }

    // Hash password with bcrypt cost 12
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'operator',
      lastLogin: new Date(),
    });

    const token = this.generateToken(user);
    return {
      user: this.formatUser(user),
      token,
    };
  }

  async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Find user (we need password so select +password if supported)
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    // In mongoose, if password is select: false, query with select('+password')
    if (!user.password && User.mongooseModel && !User.isMemoryMode()) {
      user = await User.mongooseModel.findOne({ email: normalizedEmail }).select('+password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    user.lastLogin = new Date();
    await user.save();

    const token = this.generateToken(user);
    return {
      user: this.formatUser(user),
      token,
    };
  }

  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }
    return this.formatUser(user);
  }

  async seedDefaultUsers() {
    try {
      const count = await User.countDocuments();
      if (count === 0) {
        console.log('[Auth] Seeding initial admin and operator accounts...');
        const adminHash = await bcrypt.hash('Password123!', BCRYPT_ROUNDS);
        await User.create({
          name: 'Platform Administrator',
          email: 'admin@agentflow.ai',
          password: adminHash,
          role: 'admin',
          lastLogin: new Date(),
        });

        const opHash = await bcrypt.hash('Password123!', BCRYPT_ROUNDS);
        await User.create({
          name: 'Alex Operator',
          email: 'operator@agentflow.ai',
          password: opHash,
          role: 'operator',
          lastLogin: new Date(),
        });
        console.log('[Auth] Default accounts seeded: admin@agentflow.ai / Password123!');
      }
    } catch (err) {
      console.warn('[Auth] Seeding error (non-fatal):', err.message);
    }
  }
}

module.exports = new AuthService();
