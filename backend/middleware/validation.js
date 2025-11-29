const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['student', 'teacher', 'admin'])
    .withMessage('Role must be student, teacher, or admin'),
  body('department')
    .optional()
    .isIn(['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'English', 'History', 'Biology'])
    .withMessage('Invalid department'),
  body('year')
    .optional()
    .isInt({ min: 1, max: 4 })
    .withMessage('Year must be between 1 and 4'),
  body('studentId')
    .optional()
    .isLength({ min: 5, max: 20 })
    .withMessage('Student ID must be between 5 and 20 characters'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('department')
    .optional()
    .isIn(['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'English', 'History', 'Biology'])
    .withMessage('Invalid department'),
  body('year')
    .optional()
    .isInt({ min: 1, max: 4 })
    .withMessage('Year must be between 1 and 4'),
  body('maxCredits')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Max credits must be between 1 and 30'),
  handleValidationErrors
];

// Course validation rules
const validateCourse = [
  body('courseCode')
    .matches(/^[A-Z]{2,4}\d{3}$/)
    .withMessage('Course code must be in format like CS301, MATH201'),
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('credits')
    .isInt({ min: 1, max: 6 })
    .withMessage('Credits must be between 1 and 6'),
  body('department')
    .isIn(['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'English', 'History', 'Biology'])
    .withMessage('Invalid department'),
  body('section')
    .matches(/^[A-Z]$/)
    .withMessage('Section must be a single letter (A-Z)'),
  body('capacity')
    .isInt({ min: 1, max: 200 })
    .withMessage('Capacity must be between 1 and 200'),
  body('semester')
    .isIn(['Fall 2024', 'Spring 2025', 'Summer 2025'])
    .withMessage('Invalid semester'),
  body('year')
    .isInt({ min: 2024 })
    .withMessage('Year must be 2024 or later'),
  body('schedule')
    .isArray({ min: 1 })
    .withMessage('At least one schedule slot is required'),
  body('schedule.*.day')
    .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])
    .withMessage('Invalid day'),
  body('schedule.*.period')
    .isIn(['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6'])
    .withMessage('Invalid period'),
  body('schedule.*.room')
    .trim()
    .notEmpty()
    .withMessage('Room is required'),
  handleValidationErrors
];

// Enrollment validation rules
const validateEnrollment = [
  body('courseId')
    .isMongoId()
    .withMessage('Invalid course ID'),
  handleValidationErrors
];

// Parameter validation
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

const validateCourseQuery = [
  query('department')
    .optional()
    .isIn(['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'English', 'History', 'Biology'])
    .withMessage('Invalid department'),
  query('semester')
    .optional()
    .isIn(['Fall 2024', 'Spring 2025', 'Summer 2025'])
    .withMessage('Invalid semester'),
  query('year')
    .optional()
    .isInt({ min: 2024 })
    .withMessage('Invalid year'),
  validatePagination
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateCourse,
  validateEnrollment,
  validateObjectId,
  validatePagination,
  validateCourseQuery
};