const Attendance = require('../Models/Attendance');
const User = require('../Models/User');
const Batch = require('../Models/Batch');

const markAttendance = async (req, res) => {
  try {
    const student = await User.findById(req.user._id).populate('batch');

    if (!student.batch) {
      return res.status(400).json({ success: false, message: 'You are not assigned to any batch.' });
    }

    const batch = student.batch;

    if (!batch.isActive) {
      return res.status(400).json({ success: false, message: 'Your batch is currently inactive.' });
    }

    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[now.getDay()];

    if (!batch.days.includes(currentDay)) {
      return res.status(400).json({ success: false, message: `No class scheduled for ${currentDay}.` });
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = batch.startTime.split(':').map(Number);
    const [endH, endM] = batch.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
      return res.status(400).json({
        success: false,
        message: `Attendance can only be marked between ${batch.startTime} and ${batch.endTime}.`
      });
    }

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const existing = await Attendance.findOne({
      student: req.user._id,
      batch: batch._id,
      date: today
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Attendance already marked for today.' });
    }

    const attendance = await Attendance.create({
      student: req.user._id,
      batch: batch._id,
      date: today,
      status: 'present',
      markedAt: now,
      ipAddress: req.clientIP || req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Attendance marked successfully.',
      data: attendance
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Attendance already marked for today.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to mark attendance.', error: error.message });
  }
};

const getMyAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 30, startDate, endDate } = req.query;
    const query = { student: req.user._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('batch', 'name course startTime endTime')
      .sort({ date: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        attendance,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch attendance.', error: error.message });
  }
};

module.exports = { markAttendance, getMyAttendance };
