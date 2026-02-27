const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const Settings = require('../Models/Settings');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token. User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
  }
  next();
};

const checkIP = async (req, res, next) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress;
    const settings = await Settings.getSettings();

    const isAllowed = settings.allowedIPs.some(allowedIP => clientIP.startsWith(allowedIP));

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Attendance can only be marked from the institute network.',
        yourIP: clientIP
      });
    }

    req.clientIP = clientIP;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'IP verification failed.' });
  }
};

module.exports = { verifyToken, isAdmin, checkIP };
