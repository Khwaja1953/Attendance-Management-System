require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoute = require('./Routes/authRoute');
const attendanceRoute = require('./Routes/attendanceRoute');
const batchRoute = require('./Routes/batchRoute');
const adminRoute = require('./Routes/adminRoute');

const app = express();

app.set('trust proxy', true);

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoute);
app.use('/api/attendance', attendanceRoute);
app.use('/api/batch', batchRoute);
app.use('/api/admin', adminRoute);

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Attendance Management System API' });
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_db';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
