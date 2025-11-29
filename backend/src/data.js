// Shared data store (replace with database later)
const bcrypt = require('bcryptjs');

const users = [
  {
    id: 1,
    name: 'Sreeja',
    email: 'sreeja@student.edu',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 1234567890
    role: 'student',
    department: 'Computer Science',
    year: 3,
    studentId: 'CS2021001',
    maxCredits: 15
  },
  {
    id: 6,
    name: 'Lakshman',
    email: 'lakshman@teacher.edu',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 1234567890
    role: 'teacher',
    department: 'Computer Science'
  },
  {
    id: 11,
    name: 'Admin',
    email: 'admin@university.edu',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 1234567890
    role: 'admin'
  }
];

const courses = [];
const enrollments = [];

module.exports = { users, courses, enrollments };