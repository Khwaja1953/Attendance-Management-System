const User = require('../Models/User');
const Attendance = require('../Models/Attendance');
const Batch = require('../Models/Batch');
const Settings = require('../Models/Settings');

const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).populate('batch').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: students });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch students.', error: error.message });
  }
};

const getBatchAttendance = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { startDate, endDate } = req.query;
    const query = { batch: batchId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name email phone')
      .populate('batch', 'name course')
      .sort({ date: -1 });

    return res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch batch attendance.', error: error.message });
  }
};

const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;
    const query = { student: studentId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('batch', 'name course')
      .sort({ date: -1 });

    return res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch student attendance.', error: error.message });
  }
};

const getBatchStats = async (req, res) => {
  try {
    const { batchId } = req.params;
    const match = { batch: require('mongoose').Types.ObjectId.createFromHexString(batchId) };

    const getStatsData = async (filterMatch) => {
      const result = await Attendance.aggregate([
        { $match: filterMatch },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
            absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
            holiday: { $sum: { $cond: [{ $eq: ['$status', 'holiday'] }, 1, 0] } }
          }
        },
        {
          $project: {
            _id: 0,
            totalRecords: 1,
            present: 1,
            absent: 1,
            holiday: 1,
            presentPercentage: { $cond: [{ $gt: ['$totalRecords', 0] }, { $multiply: [{ $divide: ['$present', '$totalRecords'] }, 100] }, 0] },
            absentPercentage: { $cond: [{ $gt: ['$totalRecords', 0] }, { $multiply: [{ $divide: ['$absent', '$totalRecords'] }, 100] }, 0] },
            holidayPercentage: { $cond: [{ $gt: ['$totalRecords', 0] }, { $multiply: [{ $divide: ['$holiday', '$totalRecords'] }, 100] }, 0] }
          }
        }
      ]);
      return result[0] || { totalRecords: 0, present: 0, absent: 0, holiday: 0, presentPercentage: 0, absentPercentage: 0, holidayPercentage: 0 };
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
    return res.status(500).json({ success: false, message: 'Failed to fetch batch stats.', error: error.message });
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

const getStudentStats = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { batchId } = req.query;

    if (batchId) {
      await syncAttendance(studentId, batchId);
    }

    const match = { student: require('mongoose').Types.ObjectId.createFromHexString(studentId) };
    
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
    return res.status(500).json({ success: false, message: 'Failed to fetch student stats.', error: error.message });
  }
};

const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch settings.', error: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { allowedIPs, instituteName } = req.body;
    const settings = await Settings.getSettings();

    if (allowedIPs !== undefined) settings.allowedIPs = allowedIPs;
    if (instituteName !== undefined) settings.instituteName = instituteName;

    await settings.save();

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully.',
      data: settings
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update settings.', error: error.message });
  }
};

const updateStudentAttendance = async (req, res) => {
  try {
    const { studentId, date, status, batchId } = req.body;
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOneAndUpdate(
      { student: studentId, batch: batchId, date: attendanceDate },
      { status, markedAt: new Date() },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, message: 'Attendance updated successfully.', data: attendance });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update student attendance.', error: error.message });
  }
};

const updateBatchAttendance = async (req, res) => {
  try {
    const { batchId, date, status } = req.body;
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const students = await User.find({ batch: batchId, role: 'student' });
    
    const operations = students.map(student => ({
      updateOne: {
        filter: { student: student._id, batch: batchId, date: attendanceDate },
        update: { status, markedAt: new Date() },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(operations);

    return res.status(200).json({ success: true, message: 'Batch attendance updated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update batch attendance.', error: error.message });
  }
};

module.exports = {
  getAllStudents,
  getBatchAttendance,
  getStudentAttendance,
  getBatchStats,
  getStudentStats,
  getSettings,
  updateSettings,
  updateStudentAttendance,
  updateBatchAttendance
};
