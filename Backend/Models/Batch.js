const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  course: { type: String, required: true, trim: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  days: { type: [String], default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Batch = mongoose.model('Batch', batchSchema);
module.exports = Batch;
