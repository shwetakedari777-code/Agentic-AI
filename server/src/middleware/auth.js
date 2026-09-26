const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token missing or invalid',
        code: 'AUTH_REQUIRED',
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Session expired or token invalid',
        code: 'AUTH_EXPIRED',
      });
    }

    const user = await User.findById(decoded.id || decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User account not found',
        code: 'USER_NOT_FOUND',
      });
    }

    req.user = {
      id: user._id.toString(),
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]`,
        code: 'FORBIDDEN',
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  requireRole,
};
