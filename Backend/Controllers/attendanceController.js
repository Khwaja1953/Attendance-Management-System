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

const syncAttendance = async (studentId, batchId) => {
  const student = await User.findById(studentId);
  const batch = await Batch.findById(batchId);
  if (!student || !batch) return;

  const startDate = new Date(student.createdAt);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const batchDays = batch.days || [];

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const currentDay = dayNames[d.getDay()];
    const dateCopy = new Date(d);
    
    let status = 'absent';
    if (currentDay === 'Sunday' || !batchDays.includes(currentDay)) {
      status = 'holiday';
    }

    const existing = await Attendance.findOne({
      student: studentId,
      batch: batchId,
      date: dateCopy
    });

    if (!existing) {
      if (dateCopy.getTime() === endDate.getTime()) {
        const now = new Date();
        const [endH, endM] = batch.endTime.split(':').map(Number);
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const endMinutes = endH * 60 + endM;

        if (currentMinutes > endMinutes || status === 'holiday') {
           await Attendance.create({
            student: studentId,
            batch: batchId,
            date: dateCopy,
            status: status
          });
        }
      } else {
        await Attendance.create({
          student: studentId,
          batch: batchId,
          date: dateCopy,
          status: status
        });
      }
    }
  }
};

const getMyStats = async (req, res) => {
  try {
    const student = await User.findById(req.user._id);
    if (!student.batch) {
      return res.status(200).json({ success: true, data: null });
    }

    await syncAttendance(req.user._id, student.batch);

    const match = { student: req.user._id };
    
    const getStatsData = async (filterMatch) => {
      const result = await Attendance.aggregate([
        { $match: filterMatch },
        {
          $group: {
            _id: null,
            totalDays: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
            absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
            holiday: { $sum: { $cond: [{ $eq: ['$status', 'holiday'] }, 1, 0] } }
          }
        },
        {
          $project: {
            _id: 0,
            totalDays: 1,
            present: 1,
            absent: 1,
            holiday: 1,
            presentPercentage: { $cond: [{ $gt: ['$totalDays', 0] }, { $multiply: [{ $divide: ['$present', '$totalDays'] }, 100] }, 0] },
            absentPercentage: { $cond: [{ $gt: ['$totalDays', 0] }, { $multiply: [{ $divide: ['$absent', '$totalDays'] }, 100] }, 0] },
            holidayPercentage: { $cond: [{ $gt: ['$totalDays', 0] }, { $multiply: [{ $divide: ['$holiday', '$totalDays'] }, 100] }, 0] }
          }
        }
      ]);
      return result[0] || { totalDays: 0, present: 0, absent: 0, holiday: 0, presentPercentage: 0, absentPercentage: 0, holidayPercentage: 0 };
    };

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    const overall = await getStatsData(match);
    const weekly = await getStatsData({ ...match, date: { $gte: oneWeekAgo } });
    const monthly = await getStatsData({ ...match, date: { $gte: oneMonthAgo } });
    const yearly = await getStatsData({ ...match, date: { $gte: oneYearAgo } });

    return res.status(200).json({
      success: true,
      data: { overall, weekly, monthly, yearly }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch attendance stats.', error: error.message });
  }
};

module.exports = { markAttendance, getMyAttendance, getMyStats };
