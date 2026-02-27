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
    const { startDate, endDate } = req.query;

    const match = { batch: require('mongoose').Types.ObjectId.createFromHexString(batchId) };
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    const stats = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$date',
          presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absentCount: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          total: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          presentCount: 1,
          absentCount: 1,
          total: 1,
          _id: 0
        }
      }
    ]);

    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch batch stats.', error: error.message });
  }
};

const getStudentStats = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const match = { student: require('mongoose').Types.ObjectId.createFromHexString(studentId) };
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    const stats = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$date',
          status: { $first: '$status' }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          status: 1,
          _id: 0
        }
      }
    ]);

    return res.status(200).json({ success: true, data: stats });
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

module.exports = {
  getAllStudents,
  getBatchAttendance,
  getStudentAttendance,
  getBatchStats,
  getStudentStats,
  getSettings,
  updateSettings
};
