const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  period: {
    type: String,
    required: true,
    enum: ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6']
  },
  room: {
    type: String,
    required: true,
    trim: true
  }
});

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: [true, 'Course code is required'],
    uppercase: true,
    trim: true,
    match: [/^[A-Z]{2,4}\d{3}$/, 'Course code must be in format like CS301, MATH201']
  },
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: [1, 'Credits must be at least 1'],
    max: [6, 'Credits cannot exceed 6']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'English', 'History', 'Biology']
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    uppercase: true,
    match: [/^[A-Z]$/, 'Section must be a single letter (A-Z)']
  },
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Course coordinator is required']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instructor is required']
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [200, 'Capacity cannot exceed 200']
  },
  enrolled: {
    type: Number,
    default: 0,
    min: [0, 'Enrolled count cannot be negative']
  },
  schedule: {
    type: [scheduleSchema],
    required: [true, 'Schedule is required'],
    validate: {
      validator: function(schedule) {
        return schedule && schedule.length > 0;
      },
      message: 'At least one schedule slot is required'
    }
  },
  prerequisites: [{
    type: String,
    trim: true
  }],
  semester: {
    type: String,
    required: [true, 'Semester is required'],
    enum: ['Fall 2024', 'Spring 2025', 'Summer 2025']
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [2024, 'Year must be 2024 or later']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for unique course code + section combination
courseSchema.index({ courseCode: 1, section: 1 }, { unique: true });

// Index for efficient queries
courseSchema.index({ department: 1, isActive: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ coordinator: 1 });

// Update the updatedAt field before saving
courseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Validate that coordinator and instructor are teachers
courseSchema.pre('save', async function(next) {
  try {
    const User = mongoose.model('User');
    
    if (this.coordinator) {
      const coordinator = await User.findById(this.coordinator);
      if (!coordinator || coordinator.role !== 'teacher') {
        return next(new Error('Coordinator must be a teacher'));
      }
    }
    
    if (this.instructor) {
      const instructor = await User.findById(this.instructor);
      if (!instructor || instructor.role !== 'teacher') {
        return next(new Error('Instructor must be a teacher'));
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Check for schedule conflicts
courseSchema.methods.hasScheduleConflict = async function(excludeId = null) {
  const query = {
    _id: { $ne: excludeId || this._id },
    isActive: true,
    $or: []
  };
  
  // Check for conflicts with this course's schedule
  this.schedule.forEach(slot => {
    query.$or.push({
      'schedule': {
        $elemMatch: {
          day: slot.day,
          period: slot.period,
          room: slot.room
        }
      }
    });
  });
  
  if (query.$or.length === 0) return false;
  
  const conflictingCourse = await this.constructor.findOne(query);
  return !!conflictingCourse;
};

// Get enrollment percentage
courseSchema.methods.getEnrollmentPercentage = function() {
  return Math.round((this.enrolled / this.capacity) * 100);
};

// Check if course is full
courseSchema.methods.isFull = function() {
  return this.enrolled >= this.capacity;
};

// Get available spots
courseSchema.methods.getAvailableSpots = function() {
  return Math.max(0, this.capacity - this.enrolled);
};

module.exports = mongoose.model('Course', courseSchema);