import { initialUsers, initialCourses, initialRegistrations } from '../data/mockData';

class ApiService {
  constructor() {
    // Initialize local storage with mock data if not exists
    if (!localStorage.getItem('users')) {
      localStorage.setItem('users', JSON.stringify(initialUsers));
    }
    if (!localStorage.getItem('courses')) {
      localStorage.setItem('courses', JSON.stringify(initialCourses));
    }
    if (!localStorage.getItem('registrations')) {
      localStorage.setItem('registrations', JSON.stringify(initialRegistrations));
    }
  }

  // Helper methods
  getUsers() {
    return JSON.parse(localStorage.getItem('users') || '[]');
  }

  getCourses() {
    return JSON.parse(localStorage.getItem('courses') || '[]');
  }

  getRegistrations() {
    return JSON.parse(localStorage.getItem('registrations') || '[]');
  }

  saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
  }

  saveCourses(courses) {
    localStorage.setItem('courses', JSON.stringify(courses));
  }

  saveRegistrations(registrations) {
    localStorage.setItem('registrations', JSON.stringify(registrations));
  }

  // Simulate async behavior
  delay(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Auth endpoints
  async login(credentials) {
    await this.delay();
    const users = this.getUsers();
    const user = users.find(u => u.email === credentials.email && u.password === credentials.password);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const token = `mock-token-${user.id}-${Date.now()}`;
    return {
      user: { ...user, password: undefined },
      token
    };
  }

  async register(userData) {
    await this.delay();
    const users = this.getUsers();
    
    // Check if email already exists
    if (users.find(u => u.email === userData.email)) {
      throw new Error('Email already exists');
    }

    const newUser = {
      ...userData,
      id: Math.max(...users.map(u => u.id), 0) + 1,
      enrolledCourses: userData.role === 'student' ? [] : undefined,
      assignedCourses: userData.role === 'teacher' ? [] : undefined
    };

    users.push(newUser);
    this.saveUsers(users);

    const token = `mock-token-${newUser.id}-${Date.now()}`;
    return {
      user: { ...newUser, password: undefined },
      token
    };
  }

  // User endpoints
  async getUserProfile(userId) {
    await this.delay();
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    return { ...user, password: undefined };
  }

  async updateUserProfile(userId, userData) {
    await this.delay();
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    users[userIndex] = { ...users[userIndex], ...userData };
    this.saveUsers(users);
    
    return { ...users[userIndex], password: undefined };
  }

  // Course endpoints
  async getAllCourses() {
    await this.delay();
    return this.getCourses();
  }

  async getCourse(courseId) {
    await this.delay();
    const courses = this.getCourses();
    const course = courses.find(c => c.id === courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }

    return course;
  }

  async createCourse(courseData) {
    await this.delay();
    const courses = this.getCourses();
    
    const newCourse = {
      ...courseData,
      id: Math.max(...courses.map(c => c.id), 0) + 1,
      enrolledStudents: []
    };

    courses.push(newCourse);
    this.saveCourses(courses);
    
    return newCourse;
  }

  async updateCourse(courseId, courseData) {
    await this.delay();
    const courses = this.getCourses();
    const courseIndex = courses.findIndex(c => c.id === courseId);
    
    if (courseIndex === -1) {
      throw new Error('Course not found');
    }

    courses[courseIndex] = { ...courses[courseIndex], ...courseData };
    this.saveCourses(courses);
    
    return courses[courseIndex];
  }

  // Enrollment endpoints
  async enrollInCourse(studentId, courseId) {
    await this.delay();
    const users = this.getUsers();
    const courses = this.getCourses();
    const registrations = this.getRegistrations();
    
    const student = users.find(u => u.id === studentId && u.role === 'student');
    const course = courses.find(c => c.id === courseId);
    
    if (!student) throw new Error('Student not found');
    if (!course) throw new Error('Course not found');
    
    // Check if already enrolled in this specific course
    if (student.enrolledCourses.includes(courseId)) {
      throw new Error('Already enrolled in this course');
    }
    
    // Check if already enrolled in another section of the same course
    const enrolledCourses = courses.filter(c => student.enrolledCourses.includes(c.id));
    const sameCourseDifferentSection = enrolledCourses.find(c => 
      c.courseCode === course.courseCode && c.id !== courseId
    );
    
    if (sameCourseDifferentSection) {
      throw new Error(`Already enrolled in ${course.courseCode} Section ${sameCourseDifferentSection.section}. Cannot enroll in multiple sections of the same course.`);
    }

    // Update student's enrolled courses
    student.enrolledCourses.push(courseId);
    
    // Update course's enrolled students and count
    if (!course.enrolledStudents) course.enrolledStudents = [];
    if (!course.enrolledStudents.includes(studentId)) {
      course.enrolledStudents.push(studentId);
    }
    course.enrolled = course.enrolledStudents.length;
    
    // Add registration record
    const registration = {
      id: Math.max(...registrations.map(r => r.id), 0) + 1,
      studentId,
      courseId,
      enrollmentDate: new Date().toISOString()
    };
    registrations.push(registration);
    
    this.saveUsers(users);
    this.saveCourses(courses);
    this.saveRegistrations(registrations);
    
    return registration;
  }

  async getStudentEnrollments(studentId) {
    await this.delay();
    const registrations = this.getRegistrations();
    return registrations.filter(r => r.studentId === studentId);
  }

  async getCourseEnrollments(courseId) {
    await this.delay();
    const registrations = this.getRegistrations();
    return registrations.filter(r => r.courseId === courseId);
  }

  async getAllEnrollments() {
    await this.delay();
    return this.getRegistrations();
  }

  async unenrollFromCourse(studentId, courseId) {
    await this.delay();
    const users = this.getUsers();
    const courses = this.getCourses();
    const registrations = this.getRegistrations();
    
    const student = users.find(u => u.id === studentId && u.role === 'student');
    const course = courses.find(c => c.id === courseId);
    
    if (!student) throw new Error('Student not found');
    if (!course) throw new Error('Course not found');
    
    // Remove from student's enrolled courses
    student.enrolledCourses = student.enrolledCourses.filter(id => id !== courseId);
    
    // Remove from course's enrolled students and update count
    if (course.enrolledStudents) {
      course.enrolledStudents = course.enrolledStudents.filter(id => id !== studentId);
    }
    course.enrolled = course.enrolledStudents ? course.enrolledStudents.length : 0;
    
    // Remove registration record
    const updatedRegistrations = registrations.filter(r => !(r.studentId === studentId && r.courseId === courseId));
    
    this.saveUsers(users);
    this.saveCourses(courses);
    this.saveRegistrations(updatedRegistrations);
    
    return { success: true };
  }

  // Additional helper methods for components
  async getAllUsers() {
    await this.delay();
    return this.getUsers();
  }

  async updateUser(userId, userData) {
    return this.updateUserProfile(userId, userData);
  }

  async deleteCourse(courseId) {
    await this.delay();
    const courses = this.getCourses();
    const updatedCourses = courses.filter(c => c.id !== courseId);
    this.saveCourses(updatedCourses);
    return { success: true };
  }

  getStudentCredits(studentId) {
    const users = this.getUsers();
    const student = users.find(u => u.id === studentId && u.role === 'student');
    if (!student || !student.enrolledCourses) return 0;
    
    const courses = this.getCourses();
    return student.enrolledCourses.reduce((total, courseId) => {
      const course = courses.find(c => c.id === courseId);
      return total + (course ? course.credits : 0);
    }, 0);
  }

  getStudentRegistrations(studentId) {
    const registrations = this.getRegistrations();
    return registrations.filter(r => r.studentId === studentId);
  }
}

export default new ApiService();