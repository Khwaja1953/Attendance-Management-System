const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'holiday'], default: 'present' },
  markedAt: { type: Date, default: Date.now },
  ipAddress: { type: String }
}, { timestamps: true });

attendanceSchema.index({ student: 1, batch: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
