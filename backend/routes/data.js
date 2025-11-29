const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { protect, isAdmin } = require('../middleware/auth');

const router = express.Router();

// @desc    Seed initial data
// @route   POST /api/data/seed
// @access  Private (Admin only)
router.post('/seed', protect, isAdmin, async (req, res) => {
  try {
    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Enrollment.deleteMany({})
    ]);

    // Create users
    const users = await User.create([
      // Students
      {
        name: 'Sreeja',
        email: 'sreeja@student.edu',
        password: '1234567890',
        role: 'student',
        department: 'Computer Science',
        year: 3,
        studentId: 'CS2021001',
        maxCredits: 18
      },
      {
        name: 'Sahithi',
        email: 'sahithi@student.edu',
        password: '1234567890',
        role: 'student',
        department: 'Mathematics',
        year: 2,
        studentId: 'MATH2022001',
        maxCredits: 18
      },
      {
        name: 'Yasaswi',
        email: 'yasaswi@student.edu',
        password: '1234567890',
        role: 'student',
        department: 'Physics',
        year: 4,
        studentId: 'PHY2020001',
        maxCredits: 21
      },
      {
        name: 'Harini',
        email: 'harini@student.edu',
        password: '1234567890',
        role: 'student',
        department: 'Computer Science',
        year: 1,
        studentId: 'CS2024001',
        maxCredits: 18
      },
      {
        name: 'Rushita',
        email: 'rushita@student.edu',
        password: '1234567890',
        role: 'student',
        department: 'Mathematics',
        year: 3,
        studentId: 'MATH2021001',
        maxCredits: 18
      },
      // Teachers
      {
        name: 'Lakshman',
        email: 'lakshman@teacher.edu',
        password: '1234567890',
        role: 'teacher',
        department: 'Computer Science',
        assignedCourses: []
      },
      {
        name: 'Lalitha',
        email: 'lalitha@teacher.edu',
        password: '1234567890',
        role: 'teacher',
        department: 'Mathematics',
        assignedCourses: []
      },
      {
        name: 'Rakshith',
        email: 'rakshith@teacher.edu',
        password: '1234567890',
        role: 'teacher',
        department: 'Physics',
        assignedCourses: []
      },
      {
        name: 'Aruna',
        email: 'aruna@teacher.edu',
        password: '1234567890',
        role: 'teacher',
        department: 'English',
        assignedCourses: []
      },
      {
        name: 'Lavanya',
        email: 'lavanya@teacher.edu',
        password: '1234567890',
        role: 'teacher',
        department: 'Computer Science',
        assignedCourses: []
      },
      // Admin
      {
        name: 'Admin',
        email: 'admin@university.edu',
        password: '1234567890',
        role: 'admin'
      }
    ]);

    // Get teachers for course assignment
    const teachers = users.filter(user => user.role === 'teacher');
    const lakshman = teachers.find(t => t.name === 'Lakshman');
    const lalitha = teachers.find(t => t.name === 'Lalitha');
    const rakshith = teachers.find(t => t.name === 'Rakshith');
    const aruna = teachers.find(t => t.name === 'Aruna');
    const lavanya = teachers.find(t => t.name === 'Lavanya');

    // Create courses
    const courses = await Course.create([
      {
        courseCode: 'CS301',
        title: 'Data Structures and Algorithms',
        description: 'Advanced data structures and algorithmic techniques',
        credits: 4,
        department: 'Computer Science',
        section: 'A',
        coordinator: lakshman._id,
        instructor: lakshman._id,
        capacity: 30,
        schedule: [
          { day: 'Monday', period: 'Period 1', room: 'CS-101' },
          { day: 'Wednesday', period: 'Period 1', room: 'CS-101' },
          { day: 'Friday', period: 'Period 1', room: 'CS-101' }
        ],
        semester: 'Fall 2024',
        year: 2024,
        enrolled: 0,
        enrolledStudents: []
      },
      {
        courseCode: 'CS301',
        title: 'Data Structures and Algorithms',
        description: 'Advanced data structures and algorithmic techniques',
        credits: 4,
        department: 'Computer Science',
        section: 'B',
        coordinator: lakshman._id,
        instructor: lavanya._id,
        capacity: 30,
        schedule: [
          { day: 'Tuesday', period: 'Period 2', room: 'CS-102' },
          { day: 'Thursday', period: 'Period 2', room: 'CS-102' },
          { day: 'Saturday', period: 'Period 1', room: 'CS-102' }
        ],
        semester: 'Fall 2024',
        year: 2024,
        enrolled: 0,
        enrolledStudents: []
      },
      {
        courseCode: 'MATH201',
        title: 'Linear Algebra',
        description: 'Vector spaces, matrices, and linear transformations',
        credits: 3,
        department: 'Mathematics',
        section: 'A',
        coordinator: lalitha._id,
        instructor: lalitha._id,
        capacity: 35,
        schedule: [
          { day: 'Monday', period: 'Period 2', room: 'MATH-201' },
          { day: 'Wednesday', period: 'Period 2', room: 'MATH-201' }
        ],
        semester: 'Fall 2024',
        year: 2024,
        enrolled: 0,
        enrolledStudents: []
      },
      {
        courseCode: 'PHY101',
        title: 'Classical Mechanics',
        description: 'Fundamental principles of classical mechanics',
        credits: 4,
        department: 'Physics',
        section: 'A',
        coordinator: rakshith._id,
        instructor: rakshith._id,
        capacity: 25,
        schedule: [
          { day: 'Tuesday', period: 'Period 1', room: 'PHY-101' },
          { day: 'Thursday', period: 'Period 1', room: 'PHY-101' },
          { day: 'Friday', period: 'Period 2', room: 'PHY-101' }
        ],
        semester: 'Fall 2024',
        year: 2024,
        enrolled: 0,
        enrolledStudents: []
      },
      {
        courseCode: 'ENG101',
        title: 'Academic Writing',
        description: 'Essential academic writing skills',
        credits: 2,
        department: 'English',
        section: 'A',
        coordinator: aruna._id,
        instructor: aruna._id,
        capacity: 40,
        schedule: [
          { day: 'Monday', period: 'Period 3', room: 'ENG-101' },
          { day: 'Wednesday', period: 'Period 3', room: 'ENG-101' }
        ],
        semester: 'Fall 2024',
        year: 2024,
        enrolled: 0,
        enrolledStudents: []
      }
    ]);

    // Update teachers' assigned courses
    await User.findByIdAndUpdate(lakshman._id, { 
      assignedCourses: courses.filter(c => c.instructor.toString() === lakshman._id.toString()).map(c => c._id)
    });
    
    await User.findByIdAndUpdate(lavanya._id, { 
      assignedCourses: courses.filter(c => c.instructor.toString() === lavanya._id.toString()).map(c => c._id)
    });
    
    await User.findByIdAndUpdate(lalitha._id, { 
      assignedCourses: courses.filter(c => c.instructor.toString() === lalitha._id.toString()).map(c => c._id)
    });
    
    await User.findByIdAndUpdate(rakshith._id, { 
      assignedCourses: courses.filter(c => c.instructor.toString() === rakshith._id.toString()).map(c => c._id)
    });
    
    await User.findByIdAndUpdate(aruna._id, { 
      assignedCourses: courses.filter(c => c.instructor.toString() === aruna._id.toString()).map(c => c._id)
    });

    res.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        users: users.length,
        courses: courses.length,
        teachers: teachers.length,
        students: users.filter(u => u.role === 'student').length
      }
    });
  } catch (error) {
    console.error('Seed data error:', error);
    res.status(500).json({ 
      message: 'Failed to seed data', 
      error: error.message 
    });
  }
});

// @desc    Clear all data
// @route   DELETE /api/data/clear
// @access  Private (Admin only)
router.delete('/clear', protect, isAdmin, async (req, res) => {
  try {
    const results = await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Enrollment.deleteMany({})
    ]);

    res.json({
      success: true,
      message: 'All data cleared successfully',
      data: {
        usersDeleted: results[0].deletedCount,
        coursesDeleted: results[1].deletedCount,
        enrollmentsDeleted: results[2].deletedCount
      }
    });
  } catch (error) {
    console.error('Clear data error:', error);
    res.status(500).json({ 
      message: 'Failed to clear data', 
      error: error.message 
    });
  }
});

// @desc    Get database statistics
// @route   GET /api/data/stats
// @access  Private (Admin only)
router.get('/stats', protect, isAdmin, async (req, res) => {
  try {
    const [userStats, courseStats, enrollmentStats] = await Promise.all([
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      Course.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } }
      ]),
      Enrollment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments({ isActive: true });
    const totalEnrollments = await Enrollment.countDocuments();

    res.json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          courses: totalCourses,
          enrollments: totalEnrollments
        },
        usersByRole: userStats,
        coursesByDepartment: courseStats,
        enrollmentsByStatus: enrollmentStats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      message: 'Failed to get statistics', 
      error: error.message 
    });
  }
});

// @desc    Export data
// @route   GET /api/data/export
// @access  Private (Admin only)
router.get('/export', protect, isAdmin, async (req, res) => {
  try {
    const [users, courses, enrollments] = await Promise.all([
      User.find({}).select('-password'),
      Course.find({}).populate('instructor coordinator', 'name email'),
      Enrollment.find({}).populate('student course', 'name email courseCode title section')
    ]);

    res.json({
      success: true,
      data: {
        users,
        courses,
        enrollments,
        exportDate: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ 
      message: 'Failed to export data', 
      error: error.message 
    });
  }
});

module.exports = router;