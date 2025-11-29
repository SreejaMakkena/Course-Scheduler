const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  status: {
    type: String,
    enum: ['enrolled', 'dropped', 'completed', 'failed'],
    default: 'enrolled'
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  dropDate: {
    type: Date
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'I', 'W'],
    default: null
  },
  credits: {
    type: Number,
    required: true
  },
  semester: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
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

// Compound index for unique student + course combination
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Indexes for efficient queries
enrollmentSchema.index({ student: 1, status: 1 });
enrollmentSchema.index({ course: 1, status: 1 });
enrollmentSchema.index({ semester: 1, year: 1 });

// Update the updatedAt field before saving
enrollmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Validate student role and get course credits
enrollmentSchema.pre('save', async function(next) {
  try {
    const User = mongoose.model('User');
    const Course = mongoose.model('Course');
    
    // Validate student
    const student = await User.findById(this.student);
    if (!student || student.role !== 'student') {
      return next(new Error('Invalid student'));
    }
    
    // Get course details and validate
    const course = await Course.findById(this.course);
    if (!course || !course.isActive) {
      return next(new Error('Invalid or inactive course'));
    }
    
    // Set credits and semester info from course
    this.credits = course.credits;
    this.semester = course.semester;
    this.year = course.year;
    
    next();
  } catch (error) {
    next(error);
  }
});

// Update course enrollment count after save
enrollmentSchema.post('save', async function() {
  try {
    const Course = mongoose.model('Course');
    const course = await Course.findById(this.course);
    
    if (course) {
      const enrolledCount = await this.constructor.countDocuments({
        course: this.course,
        status: 'enrolled'
      });
      
      const enrolledStudents = await this.constructor.find({
        course: this.course,
        status: 'enrolled'
      }).distinct('student');
      
      course.enrolled = enrolledCount;
      course.enrolledStudents = enrolledStudents;
      await course.save();
    }
  } catch (error) {
    console.error('Error updating course enrollment count:', error);
  }
});

// Update course enrollment count after remove
enrollmentSchema.post('remove', async function() {
  try {
    const Course = mongoose.model('Course');
    const course = await Course.findById(this.course);
    
    if (course) {
      const enrolledCount = await this.constructor.countDocuments({
        course: this.course,
        status: 'enrolled'
      });
      
      const enrolledStudents = await this.constructor.find({
        course: this.course,
        status: 'enrolled'
      }).distinct('student');
      
      course.enrolled = enrolledCount;
      course.enrolledStudents = enrolledStudents;
      await course.save();
    }
  } catch (error) {
    console.error('Error updating course enrollment count after removal:', error);
  }
});

// Check for schedule conflicts
enrollmentSchema.methods.hasScheduleConflict = async function() {
  const Course = mongoose.model('Course');
  
  // Get this course's schedule
  const thisCourse = await Course.findById(this.course);
  if (!thisCourse) return false;
  
  // Get student's other enrolled courses
  const otherEnrollments = await this.constructor.find({
    student: this.student,
    status: 'enrolled',
    course: { $ne: this.course }
  }).populate('course');
  
  // Check for schedule conflicts
  for (const enrollment of otherEnrollments) {
    const otherCourse = enrollment.course;
    
    for (const thisSlot of thisCourse.schedule) {
      for (const otherSlot of otherCourse.schedule) {
        if (thisSlot.day === otherSlot.day && thisSlot.period === otherSlot.period) {
          return {
            conflict: true,
            conflictingCourse: otherCourse,
            conflictingSlot: otherSlot
          };
        }
      }
    }
  }
  
  return { conflict: false };
};

// Check if student exceeds credit limit
enrollmentSchema.methods.exceedsCreditLimit = async function() {
  const User = mongoose.model('User');
  const student = await User.findById(this.student);
  
  if (!student) return true;
  
  const totalCredits = await student.getTotalCredits();
  const newTotalCredits = totalCredits + this.credits;
  
  return {
    exceeds: newTotalCredits > student.maxCredits,
    currentCredits: totalCredits,
    newTotalCredits: newTotalCredits,
    maxCredits: student.maxCredits
  };
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);