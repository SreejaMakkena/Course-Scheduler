const express = require('express');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const { protect, authorize, isStudent } = require('../middleware/auth');
const { validateEnrollment, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @desc    Get all enrollments
// @route   GET /api/enrollments
// @access  Private (Admin only)
router.get('/', protect, authorize('admin'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { status, semester, year, student, course } = req.query;
    
    // Build query
    let query = {};
    if (status) query.status = status;
    if (semester) query.semester = semester;
    if (year) query.year = parseInt(year);
    if (student) query.student = student;
    if (course) query.course = course;
    
    const enrollments = await Enrollment.find(query)
      .populate('student', 'name studentId department year email')
      .populate('course', 'courseCode title section department credits')
      .sort({ enrollmentDate: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Enrollment.countDocuments(query);
    
    res.json({
      success: true,
      data: enrollments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ 
      message: 'Failed to get enrollments', 
      error: error.message 
    });
  }
});

// @desc    Get student's enrollments
// @route   GET /api/enrollments/student/:studentId
// @access  Private (Student can see own, Admin/Teacher can see all)
router.get('/student/:studentId', protect, validateObjectId, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Check authorization
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { status = 'enrolled' } = req.query;
    
    const enrollments = await Enrollment.find({ 
      student: studentId,
      status: status
    })
      .populate('course', 'courseCode title section department credits schedule instructor')
      .populate({
        path: 'course',
        populate: {
          path: 'instructor',
          select: 'name email'
        }
      })
      .sort({ enrollmentDate: -1 });
    
    // Calculate total credits
    const totalCredits = enrollments.reduce((sum, enrollment) => sum + enrollment.credits, 0);
    
    res.json({
      success: true,
      data: {
        enrollments,
        totalCredits,
        enrollmentCount: enrollments.length
      }
    });
  } catch (error) {
    console.error('Get student enrollments error:', error);
    res.status(500).json({ 
      message: 'Failed to get student enrollments', 
      error: error.message 
    });
  }
});

// @desc    Get course enrollments
// @route   GET /api/enrollments/course/:courseId
// @access  Private (Teacher for own courses, Admin for all)
router.get('/course/:courseId', protect, validateObjectId, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Check if course exists and user has access
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check authorization
    if (req.user.role === 'teacher' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { status = 'enrolled' } = req.query;
    
    const enrollments = await Enrollment.find({ 
      course: courseId,
      status: status
    })
      .populate('student', 'name studentId department year email')
      .sort({ enrollmentDate: -1 });
    
    res.json({
      success: true,
      data: {
        course: {
          id: course._id,
          courseCode: course.courseCode,
          title: course.title,
          section: course.section,
          capacity: course.capacity,
          enrolled: course.enrolled
        },
        enrollments,
        enrollmentCount: enrollments.length
      }
    });
  } catch (error) {
    console.error('Get course enrollments error:', error);
    res.status(500).json({ 
      message: 'Failed to get course enrollments', 
      error: error.message 
    });
  }
});

// @desc    Enroll in course
// @route   POST /api/enrollments
// @access  Private (Student only)
router.post('/', protect, isStudent, validateEnrollment, async (req, res) => {
  try {
    const { courseId } = req.body;
    const studentId = req.user._id;
    
    // Check if course exists and is active
    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return res.status(404).json({ message: 'Course not found or inactive' });
    }
    
    // Check if course is full
    if (course.isFull()) {
      return res.status(400).json({ message: 'Course is full' });
    }
    
    // Check if student is already enrolled in this course
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      status: 'enrolled'
    });
    
    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }
    
    // Check if student is already enrolled in another section of the same course
    const sameCodeEnrollment = await Enrollment.findOne({
      student: studentId,
      status: 'enrolled'
    }).populate('course');
    
    if (sameCodeEnrollment) {
      const enrolledCourses = await Enrollment.find({
        student: studentId,
        status: 'enrolled'
      }).populate('course');
      
      for (const enrollment of enrolledCourses) {
        if (enrollment.course.courseCode === course.courseCode) {
          return res.status(400).json({ 
            message: `Already enrolled in ${course.courseCode} Section ${enrollment.course.section}` 
          });
        }
      }
    }
    
    // Create temporary enrollment to check constraints
    const tempEnrollment = new Enrollment({
      student: studentId,
      course: courseId,
      credits: course.credits,
      semester: course.semester,
      year: course.year
    });
    
    // Check credit limit
    const creditCheck = await tempEnrollment.exceedsCreditLimit();
    if (creditCheck.exceeds) {
      return res.status(400).json({ 
        message: `Enrollment would exceed credit limit. Current: ${creditCheck.currentCredits}, New total: ${creditCheck.newTotalCredits}, Max: ${creditCheck.maxCredits}` 
      });
    }
    
    // Check schedule conflicts
    const conflictCheck = await tempEnrollment.hasScheduleConflict();
    if (conflictCheck.conflict) {
      return res.status(400).json({ 
        message: `Schedule conflict with ${conflictCheck.conflictingCourse.courseCode} on ${conflictCheck.conflictingSlot.day} ${conflictCheck.conflictingSlot.period}` 
      });
    }
    
    // Create enrollment
    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      credits: course.credits,
      semester: course.semester,
      year: course.year
    });
    
    // Populate enrollment data
    const populatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate('student', 'name studentId department year')
      .populate('course', 'courseCode title section department credits schedule');
    
    res.status(201).json({
      success: true,
      message: 'Enrolled successfully',
      data: populatedEnrollment
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ 
      message: 'Failed to enroll in course', 
      error: error.message 
    });
  }
});

// @desc    Drop course (unenroll)
// @route   DELETE /api/enrollments/:id
// @access  Private (Student can drop own, Admin can drop any)
router.delete('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course', 'courseCode title section');
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Check authorization
    if (req.user.role === 'student' && enrollment.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if enrollment is already dropped
    if (enrollment.status === 'dropped') {
      return res.status(400).json({ message: 'Course already dropped' });
    }
    
    // Update enrollment status instead of deleting
    enrollment.status = 'dropped';
    enrollment.dropDate = new Date();
    await enrollment.save();
    
    res.json({
      success: true,
      message: `Dropped from ${enrollment.course.courseCode} ${enrollment.course.section}`,
      data: enrollment
    });
  } catch (error) {
    console.error('Drop course error:', error);
    res.status(500).json({ 
      message: 'Failed to drop course', 
      error: error.message 
    });
  }
});

// @desc    Update enrollment (grade, status)
// @route   PUT /api/enrollments/:id
// @access  Private (Teacher for own courses, Admin for all)
router.put('/:id', protect, authorize('teacher', 'admin'), validateObjectId, async (req, res) => {
  try {
    const { grade, status } = req.body;
    
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course')
      .populate('student', 'name studentId');
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Check authorization for teachers
    if (req.user.role === 'teacher' && enrollment.course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update fields
    if (grade) {
      const validGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'I', 'W'];
      if (!validGrades.includes(grade)) {
        return res.status(400).json({ message: 'Invalid grade' });
      }
      enrollment.grade = grade;
    }
    
    if (status) {
      const validStatuses = ['enrolled', 'dropped', 'completed', 'failed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      enrollment.status = status;
      
      if (status === 'dropped' && !enrollment.dropDate) {
        enrollment.dropDate = new Date();
      }
    }
    
    await enrollment.save();
    
    res.json({
      success: true,
      message: 'Enrollment updated successfully',
      data: enrollment
    });
  } catch (error) {
    console.error('Update enrollment error:', error);
    res.status(500).json({ 
      message: 'Failed to update enrollment', 
      error: error.message 
    });
  }
});

// @desc    Get enrollment statistics
// @route   GET /api/enrollments/stats
// @access  Private (Admin only)
router.get('/admin/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const totalEnrollments = await Enrollment.countDocuments({ status: 'enrolled' });
    const totalDropped = await Enrollment.countDocuments({ status: 'dropped' });
    const totalCompleted = await Enrollment.countDocuments({ status: 'completed' });
    
    // Department-wise enrollment distribution
    const departmentStats = await Enrollment.aggregate([
      { $match: { status: 'enrolled' } },
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: '$studentInfo' },
      { $group: { _id: '$studentInfo.department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Year-wise enrollment distribution
    const yearStats = await Enrollment.aggregate([
      { $match: { status: 'enrolled' } },
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: '$studentInfo' },
      { $group: { _id: '$studentInfo.year', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Credit distribution
    const creditStats = await Enrollment.aggregate([
      { $match: { status: 'enrolled' } },
      {
        $group: {
          _id: '$student',
          totalCredits: { $sum: '$credits' }
        }
      },
      {
        $group: {
          _id: null,
          averageCredits: { $avg: '$totalCredits' },
          minCredits: { $min: '$totalCredits' },
          maxCredits: { $max: '$totalCredits' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        totalEnrollments,
        totalDropped,
        totalCompleted,
        departmentStats,
        yearStats,
        creditStats: creditStats[0] || { averageCredits: 0, minCredits: 0, maxCredits: 0 }
      }
    });
  } catch (error) {
    console.error('Get enrollment stats error:', error);
    res.status(500).json({ 
      message: 'Failed to get enrollment statistics', 
      error: error.message 
    });
  }
});

// @desc    Bulk enroll students
// @route   POST /api/enrollments/bulk
// @access  Private (Admin only)
router.post('/bulk', protect, authorize('admin'), async (req, res) => {
  try {
    const { enrollments } = req.body; // Array of { studentId, courseId }
    
    if (!Array.isArray(enrollments) || enrollments.length === 0) {
      return res.status(400).json({ message: 'Enrollments array is required' });
    }
    
    const results = {
      successful: [],
      failed: []
    };
    
    for (const { studentId, courseId } of enrollments) {
      try {
        // Validate student and course
        const [student, course] = await Promise.all([
          User.findById(studentId),
          Course.findById(courseId)
        ]);
        
        if (!student || student.role !== 'student') {
          results.failed.push({ studentId, courseId, error: 'Invalid student' });
          continue;
        }
        
        if (!course || !course.isActive) {
          results.failed.push({ studentId, courseId, error: 'Invalid or inactive course' });
          continue;
        }
        
        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
          student: studentId,
          course: courseId,
          status: 'enrolled'
        });
        
        if (existingEnrollment) {
          results.failed.push({ studentId, courseId, error: 'Already enrolled' });
          continue;
        }
        
        // Create enrollment
        const enrollment = await Enrollment.create({
          student: studentId,
          course: courseId,
          credits: course.credits,
          semester: course.semester,
          year: course.year
        });
        
        results.successful.push({ studentId, courseId, enrollmentId: enrollment._id });
      } catch (error) {
        results.failed.push({ studentId, courseId, error: error.message });
      }
    }
    
    res.json({
      success: true,
      message: `Bulk enrollment completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
      data: results
    });
  } catch (error) {
    console.error('Bulk enrollment error:', error);
    res.status(500).json({ 
      message: 'Failed to process bulk enrollment', 
      error: error.message 
    });
  }
});

module.exports = router;