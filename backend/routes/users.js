const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { protect, authorize, isAdmin, isOwnerOrAdmin } = require('../middleware/auth');
const { validateUserUpdate, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
router.get('/', protect, isAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { role, department, search } = req.query;
    
    // Build query
    let query = {};
    if (role) query.role = role;
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .populate('assignedCourses', 'courseCode title section')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      message: 'Failed to get users', 
      error: error.message 
    });
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Owner or Admin)
router.get('/:id', protect, validateObjectId, isOwnerOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('assignedCourses', 'courseCode title section department');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get additional data based on role
    let additionalData = {};
    
    if (user.role === 'student') {
      // Get enrolled courses
      const enrollments = await Enrollment.find({ 
        student: user._id, 
        status: 'enrolled' 
      }).populate('course', 'courseCode title section credits department schedule');
      
      additionalData.enrolledCourses = enrollments;
      additionalData.totalCredits = await user.getTotalCredits();
      additionalData.enrolledCoursesCount = enrollments.length;
    } else if (user.role === 'teacher') {
      // Get assigned courses with enrollment stats
      const assignedCourses = await Course.find({ 
        instructor: user._id, 
        isActive: true 
      }).populate('enrolledStudents', 'name studentId department year');
      
      additionalData.assignedCoursesDetails = assignedCourses;
      additionalData.totalStudents = assignedCourses.reduce((sum, course) => sum + course.enrolled, 0);
    }
    
    res.json({
      success: true,
      data: {
        ...user.toJSON(),
        ...additionalData
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      message: 'Failed to get user', 
      error: error.message 
    });
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Owner or Admin)
router.put('/:id', protect, validateObjectId, validateUserUpdate, isOwnerOrAdmin, async (req, res) => {
  try {
    const { name, email, department, year, maxCredits, isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (department) user.department = department;
    if (year && user.role === 'student') user.year = year;
    if (maxCredits && user.role === 'student') user.maxCredits = maxCredits;
    
    // Only admin can change isActive status
    if (req.user.role === 'admin' && typeof isActive === 'boolean') {
      user.isActive = isActive;
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      message: 'Failed to update user', 
      error: error.message 
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
router.delete('/:id', protect, validateObjectId, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has active enrollments or assigned courses
    if (user.role === 'student') {
      const activeEnrollments = await Enrollment.countDocuments({ 
        student: user._id, 
        status: 'enrolled' 
      });
      
      if (activeEnrollments > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete student with active enrollments. Please drop all courses first.' 
        });
      }
    } else if (user.role === 'teacher') {
      const assignedCourses = await Course.countDocuments({ 
        $or: [
          { instructor: user._id },
          { coordinator: user._id }
        ],
        isActive: true 
      });
      
      if (assignedCourses > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete teacher with assigned courses. Please reassign courses first.' 
        });
      }
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      message: 'Failed to delete user', 
      error: error.message 
    });
  }
});

// @desc    Get students
// @route   GET /api/users/students
// @access  Private (Teacher, Admin)
router.get('/role/students', protect, authorize('teacher', 'admin'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { department, year, search } = req.query;
    
    let query = { role: 'student' };
    if (department) query.department = department;
    if (year) query.year = parseInt(year);
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }
    
    const students = await User.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ 
      message: 'Failed to get students', 
      error: error.message 
    });
  }
});

// @desc    Get teachers
// @route   GET /api/users/teachers
// @access  Private (Admin)
router.get('/role/teachers', protect, isAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { department, search } = req.query;
    
    let query = { role: 'teacher' };
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const teachers = await User.find(query)
      .populate('assignedCourses', 'courseCode title section')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: teachers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ 
      message: 'Failed to get teachers', 
      error: error.message 
    });
  }
});

// @desc    Assign courses to teacher
// @route   POST /api/users/:id/assign-courses
// @access  Private (Admin only)
router.post('/:id/assign-courses', protect, validateObjectId, isAdmin, async (req, res) => {
  try {
    const { courseIds } = req.body;
    
    if (!Array.isArray(courseIds)) {
      return res.status(400).json({ message: 'Course IDs must be an array' });
    }
    
    const teacher = await User.findById(req.params.id);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Verify all courses exist and are active
    const courses = await Course.find({ 
      _id: { $in: courseIds }, 
      isActive: true 
    });
    
    if (courses.length !== courseIds.length) {
      return res.status(400).json({ message: 'Some courses not found or inactive' });
    }
    
    // Update teacher's assigned courses
    teacher.assignedCourses = [...new Set([...teacher.assignedCourses, ...courseIds])];
    await teacher.save();
    
    // Update courses' instructor field
    await Course.updateMany(
      { _id: { $in: courseIds } },
      { instructor: teacher._id }
    );
    
    res.json({
      success: true,
      message: 'Courses assigned successfully',
      data: teacher
    });
  } catch (error) {
    console.error('Assign courses error:', error);
    res.status(500).json({ 
      message: 'Failed to assign courses', 
      error: error.message 
    });
  }
});

module.exports = router;