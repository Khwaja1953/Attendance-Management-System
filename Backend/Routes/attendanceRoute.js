const express = require('express');
const router = express.Router();
const { markAttendance, getMyAttendance } = require('../Controllers/attendanceController');
const { verifyToken, checkIP } = require('../Middleware/auth');

router.post('/mark', verifyToken, checkIP, markAttendance);
router.get('/my', verifyToken, getMyAttendance);

module.exports = router;
