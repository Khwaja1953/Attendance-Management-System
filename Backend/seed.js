require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./Models/User');
const Batch = require('./Models/Batch');
const Settings = require('./Models/Settings');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_db';

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Seed Settings
    const existingSettings = await Settings.findOne();
    if (!existingSettings) {
      await Settings.create({
        allowedIPs: ['127.0.0.1', '::1', '::ffff:127.0.0.1'],
        instituteName: 'Institute of Leadership & Skills'
      });
      console.log('Default settings created');
    } else {
      console.log('Settings already exist, skipping');
    }

    // Seed Batch
    let batch = await Batch.findOne({ name: 'Batch A - Morning' });
    if (!batch) {
      batch = await Batch.create({
        name: 'Batch A - Morning',
        course: 'Full Stack Development',
        startTime: '09:00',
        endTime: '12:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        isActive: true
      });
      console.log('Sample batch created');
    } else {
      console.log('Sample batch already exists, skipping');
    }

    // Seed Admin
    const existingAdmin = await User.findOne({ email: 'admin@institute.com' });
    if (!existingAdmin) {
      await User.create({
        name: 'Admin',
        parentage: 'N/A',
        phone: '0000000000',
        email: 'admin@institute.com',
        password: 'admin123',
        role: 'admin',
        isVerified: true,
        address: 'Institute Campus'
      });
      console.log('Admin user created (admin@institute.com / admin123)');
    } else {
      console.log('Admin user already exists, skipping');
    }

    console.log('\nSeeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seed();
