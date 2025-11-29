import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { departments, days, timeSlots } from '../data/mockData';
import { Users, BookOpen, TrendingUp, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const [courseForm, setCourseForm] = useState({
    courseCode: '',
    title: '',
    description: '',
    credits: 3,
    department: '',
    coordinator: '',
    instructor: '',
    section: 'A',
    capacity: 30,
    schedule: [{ day: 'Monday', period: 'Period 1', room: '' }],
    prerequisites: [],
    semester: 'Fall 2024',
    year: 2024
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allCourses = await apiService.getAllCourses();
      const allUsers = await apiService.getAllUsers();
      setCourses(allCourses);
      setUsers(allUsers);
      generateAnalytics(allCourses, allUsers);
    } catch (error) {
      console.error('Error loading data:', error);
      setCourses([]);
      setUsers([]);
    }
  };

  const generateAnalytics = (courses, users) => {
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    const students = users.filter(u => u.role === 'student');
    const activeCourses = courses.filter(c => c.isActive !== false);
    
    const totalStudents = students.length;
    const uniqueCourseCodes = [...new Set(activeCourses.map(c => c.courseCode))];
    const totalCourses = uniqueCourseCodes.length;
    const totalEnrollments = registrations.length;

    // Popular courses
    const popularCourses = activeCourses
      .sort((a, b) => (b.enrolled || 0) - (a.enrolled || 0))
      .slice(0, 5)
      .map(course => ({
        courseCode: course.courseCode || 'N/A',
        title: course.title || 'Untitled',
        enrolled: course.enrolled || 0,
        capacity: course.capacity || 30
      }));

    // Student department distribution (actual enrolled students)
    const studentDepartmentStats = {};
    const studentYearStats = {};
    
    activeCourses.forEach(course => {
      if (course.enrolledStudents) {
        course.enrolledStudents.forEach(studentId => {
          const student = students.find(s => s.id === studentId);
          if (student) {
            // Department distribution
            if (student.department) {
              studentDepartmentStats[student.department] = (studentDepartmentStats[student.department] || 0) + 1;
            }
            // Year distribution
            if (student.year) {
              const yearKey = `Year ${student.year}`;
              studentYearStats[yearKey] = (studentYearStats[yearKey] || 0) + 1;
            }
          }
        });
      }
    });

    const departmentData = Object.entries(studentDepartmentStats)
      .filter(([_, count]) => count > 0)
      .map(([dept, count]) => ({
        name: dept,
        value: count
      }));
      
    const yearData = Object.entries(studentYearStats)
      .filter(([_, count]) => count > 0)
      .map(([year, count]) => ({
        name: year,
        value: count
      }));

    // Course utilization by department
    const departmentUtilization = activeCourses.reduce((acc, course) => {
      const dept = course.department || 'Other';
      if (!acc[dept]) {
        acc[dept] = { enrolled: 0, capacity: 0 };
      }
      acc[dept].enrolled += course.enrolled || 0;
      acc[dept].capacity += course.capacity || 30;
      return acc;
    }, {});
    
    const utilizationData = Object.entries(departmentUtilization)
      .map(([dept, data]) => ({
        department: dept,
        utilization: ((data.enrolled / data.capacity) * 100).toFixed(1),
        enrolled: data.enrolled,
        capacity: data.capacity
      }));

    setAnalytics({
      totalStudents,
      totalCourses,
      totalEnrollments,
      popularCourses,
      departmentData,
      yearData,
      utilizationData
    });
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCourse) {
        const updatedCourse = { ...courseForm, id: editingCourse.id, enrolled: editingCourse.enrolled };
        await apiService.updateCourse(editingCourse.id, updatedCourse);
        
        // Update instructor assignment
        if (courseForm.instructor !== editingCourse.instructor) {
          const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
          const updatedUsers = allUsers.map(user => {
            if (user.role === 'teacher') {
              let assignedCourses = user.assignedCourses || [];
              
              // Remove from old instructor
              if (user.id === editingCourse.instructor) {
                assignedCourses = assignedCourses.filter(id => id !== editingCourse.id);
              }
              
              // Add to new instructor
              if (user.id === courseForm.instructor && !assignedCourses.includes(editingCourse.id)) {
                assignedCourses.push(editingCourse.id);
              }
              
              return { ...user, assignedCourses };
            }
            return user;
          });
          localStorage.setItem('users', JSON.stringify(updatedUsers));
        }
        
        toast.success('Course updated successfully!');
      } else {
        const newCourse = { ...courseForm, enrolled: 0, isActive: true };
        const createdCourse = await apiService.createCourse(newCourse);
        
        // Assign course to instructor
        if (courseForm.instructor) {
          const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
          const updatedUsers = allUsers.map(user => {
            if (user.id === courseForm.instructor && user.role === 'teacher') {
              const assignedCourses = user.assignedCourses || [];
              if (!assignedCourses.includes(createdCourse.id)) {
                assignedCourses.push(createdCourse.id);
              }
              return { ...user, assignedCourses };
            }
            return user;
          });
          localStorage.setItem('users', JSON.stringify(updatedUsers));
        }
        
        toast.success('Course created successfully!');
      }
      
      setShowCourseModal(false);
      setEditingCourse(null);
      resetCourseForm();
      loadData();
    } catch (error) {
      toast.error('Failed to save course');
    }
  };

  const resetCourseForm = () => {
    setCourseForm({
      courseCode: '',
      title: '',
      description: '',
      credits: 3,
      department: '',
      coordinator: '',
      instructor: '',
      section: 'A',
      capacity: 30,
      schedule: [{ day: 'Monday', period: 'Period 1', room: '' }],
      prerequisites: [],
      semester: 'Fall 2024',
      year: 2024
    });
  };

  const editCourse = (course) => {
    setEditingCourse(course);
    setCourseForm({
      courseCode: course.courseCode,
      title: course.title,
      description: course.description || '',
      credits: course.credits,
      department: course.department,
      coordinator: course.coordinator,
      instructor: course.instructor,
      section: course.section || 'A',
      capacity: course.capacity,
      schedule: course.schedule || [{ day: 'Monday', period: 'Period 1', room: '' }],
      prerequisites: course.prerequisites || [],
      semester: course.semester,
      year: course.year
    });
    setShowCourseModal(true);
  };

  const deleteCourse = (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      const courses = JSON.parse(localStorage.getItem('courses') || '[]');
      const updatedCourses = courses.filter(c => c.id !== courseId);
      localStorage.setItem('courses', JSON.stringify(updatedCourses));
      toast.success('Course deleted successfully!');
      loadData();
    }
  };

  const addScheduleSlot = () => {
    setCourseForm({
      ...courseForm,
      schedule: [...courseForm.schedule, { day: 'Monday', period: 'Period 1', room: '' }]
    });
  };

  const removeScheduleSlot = (index) => {
    const newSchedule = courseForm.schedule.filter((_, i) => i !== index);
    setCourseForm({ ...courseForm, schedule: newSchedule });
  };

  const updateScheduleSlot = (index, field, value) => {
    const newSchedule = [...courseForm.schedule];
    newSchedule[index][field] = value;
    setCourseForm({ ...courseForm, schedule: newSchedule });
  };

  const getGlobalCreditLimit = () => {
    return parseInt(localStorage.getItem('globalCreditLimit')) || 18;
  };

  const getMinCreditLimit = () => {
    return parseInt(localStorage.getItem('minCreditLimit')) || 12;
  };

  const updateMinCreditLimit = (newMin) => {
    localStorage.setItem('minCreditLimit', newMin.toString());
    toast.success(`Minimum credit limit updated to ${newMin} credits!`);
    loadData();
  };

  const updateGlobalCreditLimit = (newLimit) => {
    localStorage.setItem('globalCreditLimit', newLimit.toString());
    
    // Update all existing students
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = allUsers.map(user => {
      if (user.role === 'student') {
        return { ...user, maxCredits: newLimit };
      }
      return user;
    });
    
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    toast.success(`Global credit limit updated to ${newLimit} credits for all students!`);
    loadData();
  };

  const teachers = users.filter(u => u.role === 'teacher');
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        
        {/* Quick Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => document.getElementById('analytics').scrollIntoView({ behavior: 'smooth' })}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
          >
            Analytics
          </button>
          <button
            onClick={() => document.getElementById('settings').scrollIntoView({ behavior: 'smooth' })}
            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"
          >
            Settings
          </button>
          <button
            onClick={() => document.getElementById('teachers').scrollIntoView({ behavior: 'smooth' })}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm"
          >
            Teachers
          </button>
          <button
            onClick={() => document.getElementById('sections').scrollIntoView({ behavior: 'smooth' })}
            className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 text-sm"
          >
            Sections
          </button>
          <button
            onClick={() => document.getElementById('courses').scrollIntoView({ behavior: 'smooth' })}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
          >
            Courses
          </button>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Students</p>
                <p className="text-2xl font-bold text-blue-900">{analytics?.totalStudents || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Active Courses</p>
                <p className="text-2xl font-bold text-green-900">{analytics?.totalCourses || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Total Enrollments</p>
                <p className="text-2xl font-bold text-purple-900">{analytics?.totalEnrollments || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      {analytics && (
        <div id="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Courses</h3>
              {analytics.popularCourses.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.popularCourses}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="courseCode" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="enrolled" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <BookOpen className="mx-auto h-12 w-12 mb-2" />
                    <p>No course data available</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Department Distribution</h3>
              {analytics.departmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.departmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="mx-auto h-12 w-12 mb-2" />
                    <p>No enrollment data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Year Distribution and Department Utilization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analytics.yearData.length > 0 && (
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Year Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.yearData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {analytics.utilizationData.length > 0 && (
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Utilization</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.utilizationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [`${value}%`, 'Utilization']} />
                    <Bar dataKey="utilization" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* System Settings */}
      <div id="settings" className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">System Settings</h3>
        
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-medium text-blue-900">Credit Limits</h4>
              <p className="text-sm text-blue-700">Set minimum and maximum credit limits for all students</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">{getMinCreditLimit()} - {getGlobalCreditLimit()}</div>
              <div className="text-sm text-blue-700">Credits Range</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Minimum Credits
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={getMinCreditLimit()}
                onChange={(e) => {
                  const newMin = parseInt(e.target.value);
                  if (newMin > 0) {
                    updateMinCreditLimit(newMin);
                  }
                }}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter minimum credits"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Maximum Credits
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={getGlobalCreditLimit()}
                onChange={(e) => {
                  const newMax = parseInt(e.target.value);
                  if (newMax > 0) {
                    updateGlobalCreditLimit(newMax);
                  }
                }}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter maximum credits"
              />
            </div>
            
            <div className="bg-white p-4 rounded-md">
              <p className="text-sm text-gray-700">
                <strong>Current Status:</strong> All students must register between {getMinCreditLimit()} and {getGlobalCreditLimit()} credits. 
                Total students: {users.filter(u => u.role === 'student').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Management */}
      <div id="teachers" className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Teacher Management</h3>
          <button
            onClick={() => {
              const name = prompt('Enter teacher name:');
              if (!name) return;
              
              const email = prompt('Enter teacher email:');
              if (!email) return;
              
              const department = prompt('Enter department:');
              if (!department) return;
              
              const newTeacher = {
                id: Math.max(...users.map(u => u.id), 0) + 1,
                name: name,
                email: email,
                password: '1234567890',
                role: 'teacher',
                department: department,
                assignedCourses: []
              };
              
              const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
              allUsers.push(newTeacher);
              localStorage.setItem('users', JSON.stringify(allUsers));
              
              toast.success('Teacher added successfully!');
              loadData();
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Teacher</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={teacher.name}
                      onChange={(e) => {
                        const updatedTeacher = { ...teacher, name: e.target.value };
                        const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
                        const userIndex = allUsers.findIndex(u => u.id === teacher.id);
                        if (userIndex !== -1) {
                          allUsers[userIndex] = updatedTeacher;
                          localStorage.setItem('users', JSON.stringify(allUsers));
                        }
                        loadData();
                      }}
                      className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="email"
                      value={teacher.email}
                      onChange={(e) => {
                        const updatedTeacher = { ...teacher, email: e.target.value };
                        const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
                        const userIndex = allUsers.findIndex(u => u.id === teacher.id);
                        if (userIndex !== -1) {
                          allUsers[userIndex] = updatedTeacher;
                          localStorage.setItem('users', JSON.stringify(allUsers));
                        }
                        loadData();
                      }}
                      className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {teacher.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        toast.success('Teacher name updated!');
                      }}
                      className="text-green-600 hover:text-green-900"
                    >
                      ✓ Saved
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section Management */}
      <div id="sections" className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Section Management</h3>
          <button
            onClick={() => {
              const courseCode = prompt('Enter course code (e.g., CS301):');
              if (!courseCode) return;
              
              const existingCourse = courses.find(c => c.courseCode === courseCode.toUpperCase());
              if (!existingCourse) {
                toast.error('Course not found!');
                return;
              }
              
              const section = prompt('Enter section letter (A, B, C, etc.):');
              if (!section) return;
              
              const newSection = {
                ...existingCourse,
                id: Math.max(...courses.map(c => c.id), 0) + 1,
                section: section.toUpperCase(),
                instructor: existingCourse.instructor,
                enrolled: 0,
                capacity: 30,
                schedule: [{ day: 'Monday', period: 'Period 1', room: 'TBA' }]
              };
              
              const allCourses = JSON.parse(localStorage.getItem('courses') || '[]');
              allCourses.push(newSection);
              localStorage.setItem('courses', JSON.stringify(allCourses));
              toast.success(`Section ${section} added!`);
              loadData();
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Section</span>
          </button>
        </div>
        
        {/* Group courses by courseCode */}
        {Object.entries(
          courses.filter(c => c.isActive).reduce((acc, course) => {
            if (!acc[course.courseCode]) acc[course.courseCode] = [];
            acc[course.courseCode].push(course);
            return acc;
          }, {})
        ).map(([courseCode, courseSections]) => (
          <div key={courseCode} className="mb-6 border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-lg font-medium text-gray-900">{courseSections[0].title}</h4>
                <p className="text-sm text-gray-600">
                  {courseCode} • {courseSections[0].credits} credits • 
                  Coordinator: {users.find(u => u.id === courseSections[0].coordinator)?.name || 'Unassigned'}
                </p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Instructor</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Enrollment</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courseSections.map((section) => {
                    const instructor = users.find(u => u.id === section.instructor);
                    return (
                      <tr key={section.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                          Section {section.section}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          <select
                            value={section.instructor}
                            onChange={async (e) => {
                              const newInstructorId = parseInt(e.target.value);
                              const oldInstructorId = section.instructor;
                              
                              console.log('Assigning instructor:', { newInstructorId, oldInstructorId, sectionId: section.id });
                              
                              const updatedSection = { ...section, instructor: newInstructorId };
                              try {
                                await apiService.updateCourse(section.id, updatedSection);
                                
                                // Update teacher assignments
                                const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
                                const updatedUsers = allUsers.map(user => {
                                  if (user.role === 'teacher') {
                                    let assignedCourses = [...(user.assignedCourses || [])];
                                    
                                    // Remove from old instructor
                                    if (user.id === oldInstructorId) {
                                      assignedCourses = assignedCourses.filter(id => id !== section.id);
                                      console.log(`Removed course ${section.id} from ${user.name}`);
                                    }
                                    
                                    // Add to new instructor
                                    if (user.id === newInstructorId) {
                                      if (!assignedCourses.includes(section.id)) {
                                        assignedCourses.push(section.id);
                                        console.log(`Added course ${section.id} to ${user.name}`);
                                      }
                                    }
                                    
                                    return { ...user, assignedCourses };
                                  }
                                  return user;
                                });
                                
                                localStorage.setItem('users', JSON.stringify(updatedUsers));
                                console.log('Updated users:', updatedUsers.filter(u => u.role === 'teacher'));
                                toast.success('Instructor updated!');
                                loadData();
                              } catch (error) {
                                console.error('Assignment error:', error);
                                toast.error('Failed to update instructor');
                              }
                            }}
                            className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select Instructor</option>
                            {teachers.map(teacher => (
                              <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {section.schedule?.map((slot, i) => (
                            <div key={i}>{slot.day} {slot.period}</div>
                          ))}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {section.enrolled}/{section.capacity}
                        </td>
                        <td className="px-4 py-2 text-sm font-medium space-x-2">
                          <button
                            onClick={() => editCourse(section)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteCourse(section.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Course Management */}
      <div id="courses" className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Course Management</h3>
          <button
            onClick={() => setShowCourseModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Course</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coordinator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrollment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(
                courses.filter(c => c.isActive).reduce((acc, course) => {
                  if (!acc[course.courseCode]) {
                    acc[course.courseCode] = {
                      ...course,
                      totalEnrolled: 0,
                      totalCapacity: 0,
                      sections: []
                    };
                  }
                  acc[course.courseCode].totalEnrolled += course.enrolled;
                  acc[course.courseCode].totalCapacity += course.capacity;
                  acc[course.courseCode].sections.push(course);
                  return acc;
                }, {})
              ).map(([courseCode, courseGroup]) => {
                const coordinator = users.find(u => u.id === courseGroup.coordinator);
                return (
                  <tr key={courseCode} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{courseGroup.title}</div>
                        <div className="text-sm text-gray-500">
                          {courseCode} • {courseGroup.credits} credits • {courseGroup.sections.length} section(s)
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {courseGroup.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {coordinator?.name || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 mr-2">
                          {courseGroup.totalEnrolled}/{courseGroup.totalCapacity}
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(courseGroup.totalEnrolled / courseGroup.totalCapacity) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => editCourse(courseGroup.sections[0])}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete all sections of ${courseCode}?`)) {
                            courseGroup.sections.forEach(section => deleteCourse(section.id));
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingCourse ? 'Edit Course' : 'Add New Course'}
                </h3>
                <button
                  onClick={() => {
                    setShowCourseModal(false);
                    setEditingCourse(null);
                    resetCourseForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleCourseSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course Code</label>
                    <input
                      type="text"
                      required
                      value={courseForm.courseCode}
                      onChange={(e) => setCourseForm({ ...courseForm, courseCode: e.target.value })}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., CS301"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Credits</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      required
                      value={courseForm.credits}
                      onChange={(e) => setCourseForm({ ...courseForm, credits: parseInt(e.target.value) })}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course Title</label>
                  <input
                    type="text"
                    required
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Data Structures and Algorithms"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Course description..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <select
                      required
                      value={courseForm.department}
                      onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                    <select
                      required
                      value={courseForm.section}
                      onChange={(e) => setCourseForm({ ...courseForm, section: e.target.value })}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course Coordinator</label>
                    <select
                      required
                      value={courseForm.coordinator}
                      onChange={(e) => setCourseForm({ ...courseForm, coordinator: parseInt(e.target.value) })}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Coordinator</option>
                      {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Section Instructor</label>
                    <select
                      required
                      value={courseForm.instructor}
                      onChange={(e) => setCourseForm({ ...courseForm, instructor: parseInt(e.target.value) })}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Instructor</option>
                      {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={courseForm.capacity}
                    onChange={(e) => setCourseForm({ ...courseForm, capacity: parseInt(e.target.value) })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Schedule */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">Schedule</label>
                    <button
                      type="button"
                      onClick={addScheduleSlot}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add Time Slot
                    </button>
                  </div>
                  
                  {courseForm.schedule.map((slot, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border rounded-lg">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Day</label>
                        <select
                          value={slot.day}
                          onChange={(e) => updateScheduleSlot(index, 'day', e.target.value)}
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          {days.map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Period</label>
                        <select
                          value={slot.period}
                          onChange={(e) => updateScheduleSlot(index, 'period', e.target.value)}
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          {timeSlots.map(period => (
                            <option key={period} value={period}>{period}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Room</label>
                        <input
                          type="text"
                          value={slot.room}
                          onChange={(e) => updateScheduleSlot(index, 'room', e.target.value)}
                          placeholder="Room Number"
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="flex items-end">
                        {courseForm.schedule.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeScheduleSlot(index)}
                            className="w-full px-3 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded-md"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCourseModal(false);
                      setEditingCourse(null);
                      resetCourseForm();
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4" />
                    <span>{editingCourse ? 'Update' : 'Create'} Course</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default AdminDashboard;