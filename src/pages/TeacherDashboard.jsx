import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import Timetable from '../components/Timetable';
import { Users, BookOpen, BarChart3, Eye, GraduationCap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalCourses: 0,
    totalStudents: 0,
    enrollmentStats: [],
    departmentData: [],
    yearData: []
  });

  useEffect(() => {
    loadTeacherData();
  }, [user]);

  const loadTeacherData = async () => {
    try {
      const allCourses = await apiService.getAllCourses();
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Find teacher by email since user context might be stale
      const currentTeacher = allUsers.find(u => u.email === user?.email && u.role === 'teacher');
      
      let teacherCourses = [];
      
      if (currentTeacher?.assignedCourses && currentTeacher.assignedCourses.length > 0) {
        teacherCourses = allCourses.filter(course => 
          currentTeacher.assignedCourses.includes(course.id)
        );
      }
      
      setCourses(teacherCourses);
      
      // Generate analytics with department distribution (only for teacher's courses)
      const departmentStats = {};
      const yearStats = {};
      let totalEnrolledStudents = 0;
      
      teacherCourses.forEach(course => {
        if (course.enrolledStudents) {
          course.enrolledStudents.forEach(studentId => {
            const student = allUsers.find(s => s.id === studentId && s.role === 'student');
            if (student) {
              totalEnrolledStudents++;
              // Department distribution
              if (student.department) {
                departmentStats[student.department] = (departmentStats[student.department] || 0) + 1;
              }
              // Year distribution
              if (student.year) {
                const yearKey = `Year ${student.year}`;
                yearStats[yearKey] = (yearStats[yearKey] || 0) + 1;
              }
            }
          });
        }
      });
      
      const departmentData = Object.entries(departmentStats).map(([dept, count]) => ({
        name: dept,
        value: count
      }));
      
      const yearData = Object.entries(yearStats).map(([year, count]) => ({
        name: year,
        value: count
      }));
      
      setAnalytics({
        totalCourses: teacherCourses.length,
        totalStudents: totalEnrolledStudents,
        enrollmentStats: teacherCourses.map(course => ({
          courseCode: course.courseCode || 'N/A',
          courseName: course.title || 'Untitled',
          enrolled: course.enrolled || 0,
          capacity: course.capacity || 30,
          utilization: (((course.enrolled || 0) / (course.capacity || 30)) * 100).toFixed(1)
        })),
        departmentData,
        yearData
      });
    } catch (error) {
      console.error('Error loading teacher data:', error);
      setCourses([]);
    }
  };



  const loadCourseStudents = async (courseId) => {
    try {
      const enrollments = await apiService.getCourseEnrollments(courseId);
      const allUsers = await apiService.getAllUsers();
      
      const enrolledStudents = enrollments.map(enrollment => {
        const student = allUsers.find(u => u.id === enrollment.studentId && u.role === 'student');
        return student ? {
          ...student,
          registrationDate: enrollment.enrollmentDate || new Date().toISOString()
        } : null;
      }).filter(Boolean);
      
      setStudents(enrolledStudents);
      setSelectedCourse(courseId);
    } catch (error) {
      console.error('Error loading course students:', error);
      setStudents([]);
      setSelectedCourse(courseId);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Teacher Dashboard</h1>
        
        {/* Quick Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => document.getElementById('analytics').scrollIntoView({ behavior: 'smooth' })}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
          >
            Analytics
          </button>
          <button
            onClick={() => document.getElementById('courses').scrollIntoView({ behavior: 'smooth' })}
            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"
          >
            My Courses
          </button>
          {selectedCourse && (
            <button
              onClick={() => document.getElementById('students').scrollIntoView({ behavior: 'smooth' })}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm"
            >
              Students
            </button>
          )}
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">My Courses</p>
                <p className="text-2xl font-bold text-blue-900">{analytics?.totalCourses || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Total Students</p>
                <p className="text-2xl font-bold text-green-900">{analytics?.totalStudents || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Avg. Utilization</p>
                <p className="text-2xl font-bold text-purple-900">
                  {analytics?.enrollmentStats?.length > 0 
                    ? Math.round(analytics.enrollmentStats.reduce((acc, course) => acc + parseFloat(course.utilization), 0) / analytics.enrollmentStats.length)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      {analytics && (
        <div id="analytics" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Enrollment</h3>
            {analytics.enrollmentStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.enrollmentStats}>
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
                  <p>No courses assigned yet</p>
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
                  <Users className="mx-auto h-12 w-12 mb-2" />
                  <p>No student enrollment data</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Year Distribution Chart */}
      {analytics && analytics.yearData.length > 0 && (
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
      


      {/* Courses List */}
      <div id="courses" className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">My Courses</h3>
        
        {courses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrolled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{course.title}</div>
                        <div className="text-sm text-gray-500">
                          {course.courseCode} - Section {course.section || 'A'} • {course.credits || 3} Credits
                        </div>
                        <div className="text-xs text-gray-400">{course.department}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.enrolled || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.capacity || 30}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${((course.enrolled || 0) / (course.capacity || 30)) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">
                          {Math.round(((course.enrolled || 0) / (course.capacity || 30)) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => loadCourseStudents(course.id)}
                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Students</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No courses assigned</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have any courses assigned yet. Contact the admin to assign courses to you.
            </p>
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
              <strong>Debug Info:</strong><br/>
              Teacher: {user?.name} (Email: {user?.email})<br/>
              Role: {user?.role}<br/>
              Fresh Data: {(() => {
                const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
                const currentTeacher = allUsers.find(u => u.email === user?.email && u.role === 'teacher');
                return JSON.stringify(currentTeacher?.assignedCourses || []);
              })()}
              <br/><br/>
              <button
                onClick={() => {
                  const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
                  const allCourses = JSON.parse(localStorage.getItem('courses') || '[]');
                  
                  console.log('=== ALL TEACHERS DEBUG ===');
                  allUsers.filter(u => u.role === 'teacher').forEach(teacher => {
                    console.log(`${teacher.name}: ${JSON.stringify(teacher.assignedCourses || [])}`);
                  });
                  console.log('All courses:', allCourses.map(c => ({ id: c.id, title: c.title, instructor: c.instructor })));
                  
                  alert('Check console for all teachers data');
                }}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs mr-2"
              >
                Debug All Teachers
              </button>
              <button
                onClick={() => {
                  const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
                  const allCourses = JSON.parse(localStorage.getItem('courses') || '[]');
                  
                  // Reset all teacher assignments
                  const updatedUsers = allUsers.map(user => {
                    if (user.role === 'teacher') {
                      const assignedCourses = allCourses
                        .filter(course => course.instructor === user.id)
                        .map(course => course.id);
                      return { ...user, assignedCourses };
                    }
                    return user;
                  });
                  
                  localStorage.setItem('users', JSON.stringify(updatedUsers));
                  alert('Fixed all teacher assignments! Refresh the page.');
                  window.location.reload();
                }}
                className="px-2 py-1 bg-green-500 text-white rounded text-xs"
              >
                Fix All Assignments
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Students List */}
      {selectedCourse && (
        <div id="students" className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Enrolled Students</h3>
              <p className="text-sm text-gray-600">{students.length} students enrolled</p>
            </div>
            <button
              onClick={() => setSelectedCourse(null)}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>
          
          {students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.department}</div>
                        <div className="text-sm text-gray-500">Year {student.year}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {apiService.getStudentCredits(student.id)}/{student.maxCredits || 18}
                        </div>
                        <div className="text-xs text-gray-500">Credits</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(student.registrationDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View Timetable</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No students enrolled</h3>
              <p className="mt-1 text-sm text-gray-500">
                No students have enrolled in this course yet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Student Timetable Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedStudent.name}'s Timetable
                </h3>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Student ID:</span> {selectedStudent.studentId}
                  </div>
                  <div>
                    <span className="font-medium">Department:</span> {selectedStudent.department}
                  </div>
                  <div>
                    <span className="font-medium">Year:</span> {selectedStudent.year}
                  </div>
                  <div>
                    <span className="font-medium">Credits:</span> {apiService.getStudentCredits(selectedStudent.id)}
                  </div>
                </div>
              </div>
              
              <Timetable studentId={selectedStudent.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;