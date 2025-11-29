const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const { protect, authorize, isAdmin } = require('../middleware/auth');
const { validateCourse, validateObjectId, validateCourseQuery } = require('../middleware/validation');

const router = express.Router();

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
router.get('/', protect, validateCourseQuery, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { department, semester, year, search, instructor } = req.query;
    
    // Build query
    let query = { isActive: true };
    if (department) query.department = department;
    if (semester) query.semester = semester;
    if (year) query.year = parseInt(year);
    if (instructor) query.instructor = instructor;
    if (search) {
      query.$or = [
        { courseCode: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }
    
    const courses = await Course.find(query)
      .populate('instructor', 'name email department')
      .populate('coordinator', 'name email department')
      .populate('enrolledStudents', 'name studentId department year')
      .sort({ courseCode: 1, section: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Course.countDocuments(query);
    
    res.json({
      success: true,
      data: courses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ 
      message: 'Failed to get courses', 
      error: error.message 
    });
  }
});

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Private
router.get('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email department')
      .populate('coordinator', 'name email department')
      .populate('enrolledStudents', 'name studentId department year email');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Get enrollment statistics
    const enrollmentStats = {
      enrolled: course.enrolled,
      capacity: course.capacity,
      available: course.getAvailableSpots(),
      percentage: course.getEnrollmentPercentage(),
      isFull: course.isFull()
    };
    
    res.json({
      success: true,
      data: {
        ...course.toJSON(),
        enrollmentStats
      }
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ 
      message: 'Failed to get course', 
      error: error.message 
    });
  }
});

// @desc    Create course
// @route   POST /api/courses
// @access  Private (Admin only)
router.post('/', protect, isAdmin, validateCourse, async (req, res) => {
  try {
    const {
      courseCode,
      title,
      description,
      credits,
      department,
      section,
      coordinator,
      instructor,
      capacity,
      schedule,
      prerequisites,
      semester,
      year
    } = req.body;
    
    // Check if course code + section combination already exists
    const existingCourse = await Course.findOne({ 
      courseCode: courseCode.toUpperCase(), 
      section: section.toUpperCase(),
      isActive: true
    });
    
    if (existingCourse) {
      return res.status(400).json({ 
        message: `Course ${courseCode} Section ${section} already exists` 
      });
    }
    
    // Verify coordinator and instructor exist and are teachers
    const [coordinatorUser, instructorUser] = await Promise.all([
      User.findById(coordinator),
      User.findById(instructor)
    ]);
    
    if (!coordinatorUser || coordinatorUser.role !== 'teacher') {
      return res.status(400).json({ message: 'Invalid coordinator' });
    }
    
    if (!instructorUser || instructorUser.role !== 'teacher') {
      return res.status(400).json({ message: 'Invalid instructor' });
    }
    
    // Create course
    const course = await Course.create({
      courseCode: courseCode.toUpperCase(),
      title,
      description,
      credits,
      department,
      section: section.toUpperCase(),
      coordinator,
      instructor,
      capacity,
      schedule,
      prerequisites: prerequisites || [],
      semester,
      year,
      enrolled: 0,
      enrolledStudents: []
    });
    
    // Check for schedule conflicts
    const hasConflict = await course.hasScheduleConflict();
    if (hasConflict) {
      await Course.findByIdAndDelete(course._id);
      return res.status(400).json({ 
        message: 'Schedule conflict detected with existing course' 
      });
    }
    
    // Add course to instructor's assigned courses
    await User.findByIdAndUpdate(
      instructor,
      { $addToSet: { assignedCourses: course._id } }
    );
    
    // Populate and return
    const populatedCourse = await Course.findById(course._id)
      .populate('instructor', 'name email department')
      .populate('coordinator', 'name email department');
    
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: populatedCourse
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ 
      message: 'Failed to create course', 
      error: error.message 
    });
  }
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Admin only)
router.put('/:id', protect, isAdmin, validateObjectId, validateCourse, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const {
      courseCode,
      title,
      description,
      credits,
      department,
      section,
      coordinator,
      instructor,
      capacity,
      schedule,
      prerequisites,
      semester,
      year
    } = req.body;
    
    // Check if course code + section combination already exists (excluding current course)
    if (courseCode || section) {
      const existingCourse = await Course.findOne({ 
        _id: { $ne: course._id },
        courseCode: (courseCode || course.courseCode).toUpperCase(), 
        section: (section || course.section).toUpperCase(),
        isActive: true
      });
      
      if (existingCourse) {
        return res.status(400).json({ 
          message: `Course ${courseCode || course.courseCode} Section ${section || course.section} already exists` 
        });
      }
    }
    
    // Verify coordinator and instructor if being changed
    if (coordinator && coordinator !== course.coordinator.toString()) {
      const coordinatorUser = await User.findById(coordinator);
      if (!coordinatorUser || coordinatorUser.role !== 'teacher') {
        return res.status(400).json({ message: 'Invalid coordinator' });
      }
    }
    
    if (instructor && instructor !== course.instructor.toString()) {
      const instructorUser = await User.findById(instructor);
      if (!instructorUser || instructorUser.role !== 'teacher') {
        return res.status(400).json({ message: 'Invalid instructor' });
      }
    }
    
    // Check if reducing capacity below current enrollment
    if (capacity && capacity < course.enrolled) {
      return res.status(400).json({ 
        message: `Cannot reduce capacity below current enrollment (${course.enrolled})` 
      });
    }
    
    // Store old instructor for cleanup
    const oldInstructor = course.instructor;
    
    // Update course fields
    if (courseCode) course.courseCode = courseCode.toUpperCase();
    if (title) course.title = title;
    if (description !== undefined) course.description = description;
    if (credits) course.credits = credits;
    if (department) course.department = department;
    if (section) course.section = section.toUpperCase();
    if (coordinator) course.coordinator = coordinator;
    if (instructor) course.instructor = instructor;
    if (capacity) course.capacity = capacity;
    if (schedule) course.schedule = schedule;
    if (prerequisites !== undefined) course.prerequisites = prerequisites;
    if (semester) course.semester = semester;
    if (year) course.year = year;
    
    // Check for schedule conflicts if schedule changed
    if (schedule) {
      const hasConflict = await course.hasScheduleConflict(course._id);
      if (hasConflict) {
        return res.status(400).json({ 
          message: 'Schedule conflict detected with existing course' 
        });
      }
    }
    
    await course.save();
    
    // Update instructor assignments if instructor changed
    if (instructor && instructor !== oldInstructor.toString()) {
      // Remove from old instructor
      await User.findByIdAndUpdate(
        oldInstructor,
        { $pull: { assignedCourses: course._id } }
      );
      
      // Add to new instructor
      await User.findByIdAndUpdate(
        instructor,
        { $addToSet: { assignedCourses: course._id } }
      );
    }
    
    // Populate and return
    const updatedCourse = await Course.findById(course._id)
      .populate('instructor', 'name email department')
      .populate('coordinator', 'name email department');
    
    res.json({
      success: true,
      message: 'Course updated successfully',
      data: updatedCourse
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ 
      message: 'Failed to update course', 
      error: error.message 
    });
  }
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Admin only)
router.delete('/:id', protect, isAdmin, validateObjectId, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if course has active enrollments
    const activeEnrollments = await Enrollment.countDocuments({ 
      course: course._id, 
      status: 'enrolled' 
    });
    
    if (activeEnrollments > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete course with active enrollments. Please drop all students first.' 
      });
    }
    
    // Remove course from instructor's assigned courses
    await User.findByIdAndUpdate(
      course.instructor,
      { $pull: { assignedCourses: course._id } }
    );
    
    // Soft delete (mark as inactive) instead of hard delete to preserve data
    course.isActive = false;
    await course.save();
    
    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ 
      message: 'Failed to delete course', 
      error: error.message 
    });
  }
});

// @desc    Get courses by instructor
// @route   GET /api/courses/instructor/:instructorId
// @access  Private (Teacher can see own, Admin can see all)
router.get('/instructor/:instructorId', protect, validateObjectId, async (req, res) => {
  try {
    const { instructorId } = req.params;
    
    // Check authorization
    if (req.user.role !== 'admin' && req.user._id.toString() !== instructorId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const courses = await Course.find({ 
      instructor: instructorId, 
      isActive: true 
    })
      .populate('enrolledStudents', 'name studentId department year')
      .sort({ courseCode: 1, section: 1 });
    
    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Get instructor courses error:', error);
    res.status(500).json({ 
      message: 'Failed to get instructor courses', 
      error: error.message 
    });
  }
});

// @desc    Get course statistics
// @route   GET /api/courses/stats
// @access  Private (Admin only)
router.get('/admin/stats', protect, isAdmin, async (req, res) => {
  try {
    const totalCourses = await Course.countDocuments({ isActive: true });
    const totalEnrollments = await Enrollment.countDocuments({ status: 'enrolled' });
    
    // Department-wise course distribution
    const departmentStats = await Course.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Enrollment statistics
    const enrollmentStats = await Course.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalCapacity: { $sum: '$capacity' },
          totalEnrolled: { $sum: '$enrolled' },
          averageEnrollment: { $avg: '$enrolled' }
        }
      }
    ]);
    
    // Popular courses
    const popularCourses = await Course.find({ isActive: true })
      .sort({ enrolled: -1 })
      .limit(5)
      .select('courseCode title section enrolled capacity department');
    
    res.json({
      success: true,
      data: {
        totalCourses,
        totalEnrollments,
        departmentStats,
        enrollmentStats: enrollmentStats[0] || { totalCapacity: 0, totalEnrolled: 0, averageEnrollment: 0 },
        popularCourses
      }
    });
  } catch (error) {
    console.error('Get course stats error:', error);
    res.status(500).json({ 
      message: 'Failed to get course statistics', 
      error: error.message 
    });
  }
});

module.exports = router;