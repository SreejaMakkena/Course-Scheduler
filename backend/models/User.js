const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    required: [true, 'Role is required']
  },
  department: {
    type: String,
    required: function() {
      return this.role === 'student' || this.role === 'teacher';
    },
    enum: ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'English', 'History', 'Biology']
  },
  year: {
    type: Number,
    required: function() {
      return this.role === 'student';
    },
    min: [1, 'Year must be at least 1'],
    max: [4, 'Year cannot exceed 4']
  },
  studentId: {
    type: String,
    required: function() {
      return this.role === 'student';
    },
    unique: true,
    sparse: true
  },
  maxCredits: {
    type: Number,
    default: 18,
    min: [1, 'Max credits must be at least 1'],
    max: [30, 'Max credits cannot exceed 30']
  },
  assignedCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get user's enrolled courses count
userSchema.methods.getEnrolledCoursesCount = async function() {
  const Enrollment = mongoose.model('Enrollment');
  return await Enrollment.countDocuments({ student: this._id, status: 'enrolled' });
};

// Get user's total credits
userSchema.methods.getTotalCredits = async function() {
  const Enrollment = mongoose.model('Enrollment');
  const Course = mongoose.model('Course');
  
  const enrollments = await Enrollment.find({ student: this._id, status: 'enrolled' }).populate('course');
  return enrollments.reduce((total, enrollment) => total + (enrollment.course.credits || 0), 0);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);