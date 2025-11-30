const { User, Course, Enrollment, mongoose } = require('../models/Database');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/course-scheduler';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected');
    await initializeData();
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  }
};

// Initialize default users if database is empty
const initializeData = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const defaultUsers = [
        {
          name: 'Sreeja',
          email: 'sreeja@student.edu',
          password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
          role: 'student',
          department: 'Computer Science',
          year: 3,
          studentId: 'CS2021001',
          maxCredits: 15
        },
        {
          name: 'Lakshman',
          email: 'lakshman@teacher.edu',
          password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
          role: 'teacher',
          department: 'Computer Science'
        },
        {
          name: 'Admin',
          email: 'admin@university.edu',
          password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
          role: 'admin'
        }
      ];
      await User.insertMany(defaultUsers);
      console.log('✅ Default users created');
    }
  } catch (error) {
    console.error('❌ Error initializing data:', error.message);
  }
};

module.exports = { User, Course, Enrollment, connectDB };