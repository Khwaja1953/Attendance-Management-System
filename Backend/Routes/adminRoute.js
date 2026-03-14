const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getBatchAttendance,
  getStudentAttendance,
  getBatchStats,
  getStudentStats,
  getSettings,
  updateSettings,
  updateStudentAttendance,
  updateBatchAttendance
} = require('../Controllers/adminController');
const { verifyToken, isAdmin } = require('../Middleware/auth');

router.get('/students', verifyToken, isAdmin, getAllStudents);
router.get('/attendance/batch/:batchId', verifyToken, isAdmin, getBatchAttendance);
router.get('/attendance/student/:studentId', verifyToken, isAdmin, getStudentAttendance);
router.post('/attendance/student', verifyToken, isAdmin, updateStudentAttendance);
router.post('/attendance/batch', verifyToken, isAdmin, updateBatchAttendance);
router.get('/stats/batch/:batchId', verifyToken, isAdmin, getBatchStats);
router.get('/stats/student/:studentId', verifyToken, isAdmin, getStudentStats);
router.get('/settings', verifyToken, isAdmin, getSettings);
router.put('/settings', verifyToken, isAdmin, updateSettings);

module.exports = router;
