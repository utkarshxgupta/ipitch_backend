const jwt = require('jwt-simple');
const User = require('../models/userModel');
const secret = process.env.JWT_SECRET || 'yoursecretkey';

const auth = async (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.decode(token, secret);
    req.user = decoded.user;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ msg: 'Token is not valid' });
    }

    next();
  } catch (err) {
    console.error(err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

const roleCheck = (roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const hasRole = roles.some(role => user.role.includes(role));
      if (!hasRole) {
        return res.status(403).json({ msg: 'Access denied' });
      }
      next();
    } catch (err) {
      res.status(500).json({ msg: 'Server error' });
    }
  };
};

module.exports = { auth, roleCheck };