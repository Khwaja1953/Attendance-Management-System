const mongoose = require('mongoose');
const attendanceSchema = new mongoose.Schema({

},{timestamps: true});
const Attendance = mongoose.model("User",attendanceSchema);
module.exports = Attendance;