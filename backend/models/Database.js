const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['student', 'teacher', 'admin'] },
  department: String,
  year: Number,
  studentId: String,
  maxCredits: Number
});

// Course Schema
const courseSchema = new mongoose.Schema({
  courseCode: String,
  title: String,
  description: String,
  credits: Number,
  department: String,
  coordinator: Number,
  instructor: Number,
  section: String,
  capacity: Number,
  enrolled: { type: Number, default: 0 },
  schedule: [{
    day: String,
    period: String,
    room: String
  }],
  prerequisites: [String],
  semester: String,
  year: Number,
  isActive: { type: Boolean, default: true }
});

// Enrollment Schema
const enrollmentSchema = new mongoose.Schema({
  studentId: Number,
  courseId: String,
  status: { type: String, default: 'enrolled' },
  registrationDate: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);
const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

module.exports = { User, Course, Enrollment, mongoose };