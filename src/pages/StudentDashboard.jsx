import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import Timetable from '../components/Timetable';
import CreditSummary from '../components/CreditSummary';
import { Search, BookOpen, AlertCircle, CheckCircle, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTimetable, setShowTimetable] = useState(false);
  const [enrollmentKey, setEnrollmentKey] = useState(0);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm]);

  const loadCourses = async () => {
    try {
      const allCourses = await apiService.getAllCourses();
      const activeCourses = allCourses.filter(course => course.isActive !== false);
      
      const coursesWithInstructor = activeCourses.map(course => ({
        ...course,
        schedule: course.schedule || [{ day: 'Monday', period: 'Period 1', room: 'TBA' }],
        instructorName: 'TBA' // Will be populated from backend later
      }));
      
      setCourses(coursesWithInstructor);
    } catch (error) {
      console.error('Failed to load courses:', error);
      setCourses([]);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.courseCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCourses(filtered);
  };

  const handleRegister = async (courseId) => {
    try {
      await apiService.enrollInCourse(user.id, courseId);
      
      toast.success('Successfully enrolled!');
      
      // Update courses state immediately
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.id === courseId 
            ? { ...course, enrolled: (course.enrolled || 0) + 1 }
            : course
        )
      );
      
      // Update user context immediately
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUser = allUsers.find(u => u.id === user.id);
      if (updatedUser) {
        localStorage.setItem('currentUser', JSON.stringify({ ...updatedUser, password: undefined }));
        Object.assign(user, { ...updatedUser, password: undefined });
      }
      
      // Force re-render
      setEnrollmentKey(prev => prev + 1);
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    }
  };

  const handleUnregister = async (courseId) => {
    try {
      await apiService.unenrollFromCourse(user.id, courseId);
      
      toast.success('Successfully dropped from course!');
      
      // Update courses state immediately
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.id === courseId 
            ? { ...course, enrolled: Math.max(0, (course.enrolled || 0) - 1) }
            : course
        )
      );
      
      // Update user context immediately
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUser = allUsers.find(u => u.id === user.id);
      if (updatedUser) {
        localStorage.setItem('currentUser', JSON.stringify({ ...updatedUser, password: undefined }));
        Object.assign(user, { ...updatedUser, password: undefined });
      }
      
      // Force re-render
      setEnrollmentKey(prev => prev + 1);
    } catch (error) {
      toast.error('Failed to drop course');
    }
  };

  const isEnrolled = (courseId) => {
    return user?.enrolledCourses?.includes(courseId) || false;
  };

  const isEnrolledInAnotherSection = (course) => {
    if (!user?.enrolledCourses) return false;
    
    const enrolledCourses = courses.filter(c => user.enrolledCourses.includes(c.id));
    return enrolledCourses.some(c => 
      c.courseCode === course.courseCode && c.id !== course.id
    );
  };

  const getAvailableSeats = (course) => {
    return (course.capacity || 30) - (course.enrolled || 0);
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCurrentCredits = () => {
    return apiService.getStudentCredits(user?.id || 0);
  };

  const getGlobalCreditLimit = () => {
    return parseInt(localStorage.getItem('globalCreditLimit')) || 18;
  };

  const getMinCreditLimit = () => {
    return parseInt(localStorage.getItem('minCreditLimit')) || 12;
  };

  const isRegistrationComplete = () => {
    const currentCredits = getCurrentCredits();
    const minCredits = getMinCreditLimit();
    const maxCredits = getGlobalCreditLimit();
    return currentCredits >= minCredits && currentCredits <= maxCredits;
  };

  const getRemainingCredits = () => {
    const currentCredits = getCurrentCredits();
    const maxCredits = getGlobalCreditLimit();
    return Math.max(0, maxCredits - currentCredits);
  };

  const wouldExceedCreditLimit = (courseCredits) => {
    const currentCredits = getCurrentCredits();
    const maxCredits = getGlobalCreditLimit();
    return (currentCredits + courseCredits) > maxCredits;
  };

  const enrolledCourses = courses.filter(course => isEnrolled(course.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name}!</p>
          </div>
          <div className="flex space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {getCurrentCredits()}/{getGlobalCreditLimit()}
              </div>
              <div className="text-sm text-gray-600">Credits (Enrolled/Limit)</div>
              <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className={`h-2 rounded-full ${
                    getCurrentCredits() > getGlobalCreditLimit() ? 'bg-red-600' : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min((getCurrentCredits() / getGlobalCreditLimit()) * 100, 100)}%` }}
                ></div>
              </div>
              <div className={`text-xs mt-1 font-medium ${
                getCurrentCredits() >= getMinCreditLimit() ? 'text-green-600' : 'text-orange-600'
              }`}>
                {getCurrentCredits() >= getMinCreditLimit() ? 'Valid Registration' : `Need ${getMinCreditLimit() - getCurrentCredits()} more credits (min ${getMinCreditLimit()})`}
              </div>
            </div>
            <div className="text-center">
              <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
                getCurrentCredits() >= getMinCreditLimit() 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {getCurrentCredits() >= getMinCreditLimit() 
                  ? '✓ Valid Registration' 
                  : '⚠ Below Minimum Credits'
                }
              </div>
            </div>
            <button
              onClick={() => setShowTimetable(!showTimetable)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {showTimetable ? 'Hide' : 'Show'} Timetable
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="mt-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* My Courses */}
      {enrolledCourses.length > 0 && (
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            My Enrolled Courses ({enrolledCourses.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledCourses.map(course => (
              <div key={course.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{course.title}</h4>
                    <p className="text-sm text-gray-600">{course.courseCode} • {course.credits} Credits</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-700 mb-2">{course.department}</p>
                <div className="text-xs text-gray-500">
                  Section {course.section || 'A'} • {course.enrolled || 0}/{course.capacity || 30} enrolled
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Credit Summary and Timetable */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CreditSummary />
        </div>
        <div className="lg:col-span-2">
          {showTimetable && <Timetable studentId={user.id} />}
        </div>
      </div>

      {/* Available Courses */}
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          Available Courses ({Object.keys(filteredCourses.reduce((acc, course) => {
            acc[course.courseCode || 'UNKNOWN'] = true;
            return acc;
          }, {})).length})
        </h3>
        
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(
              filteredCourses.reduce((acc, course) => {
                const courseCode = course.courseCode || 'UNKNOWN';
                if (!acc[courseCode]) {
                  acc[courseCode] = {
                    ...course,
                    sections: []
                  };
                }
                acc[courseCode].sections.push(course);
                return acc;
              }, {})
            ).map(([courseCode, courseGroup]) => {
              const enrolledSection = courseGroup.sections.find(section => isEnrolled(section.id));
              const wouldExceed = wouldExceedCreditLimit(courseGroup.credits || 3);
              
              return (
                <div key={courseCode} className={`border rounded-lg p-4 ${
                  enrolledSection ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{courseGroup.title}</h4>
                      <p className="text-sm text-gray-600">
                        {courseCode} • {courseGroup.credits || 3} Credits
                      </p>
                    </div>
                    {enrolledSection && <CheckCircle className="h-5 w-5 text-green-600" />}
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3">{courseGroup.department}</p>
                  
                  {courseGroup.description && (
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">{courseGroup.description}</p>
                  )}
                  
                  {/* Sections */}
                  <div className="mb-3">
                    <h5 className="text-xs font-medium text-gray-700 mb-2">Available Sections ({courseGroup.sections.length}):</h5>
                    <div className="space-y-2">
                      {courseGroup.sections.map(section => {
                        const enrolled = isEnrolled(section.id);
                        const availableSeats = getAvailableSeats(section);
                        
                        return (
                          <div key={section.id} className={`border rounded p-2 text-xs ${
                            enrolled ? 'border-green-300 bg-green-50' : 'border-gray-200'
                          }`}>
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <span className="font-medium">Section {section.section || 'A'}</span>
                                <span className="text-gray-500 ml-2">
                                  {section.enrolled || 0}/{section.capacity || 30} enrolled
                                </span>
                              </div>
                              {enrolled && <CheckCircle className="h-3 w-3 text-green-600" />}
                            </div>
                            
                            {section.schedule && section.schedule.length > 0 && (
                              <div className="mb-1">
                                <div className="flex flex-wrap gap-1">
                                  {section.schedule.map((slot, index) => (
                                    <span key={index} className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                                      {slot.day}: {slot.period}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex justify-between items-center">
                              <span className={`text-xs ${
                                enrolled ? 'text-green-600 font-medium' : 
                                availableSeats > 0 ? 'text-blue-600' : 'text-red-600'
                              }`}>
                                {enrolled ? 'Enrolled' : 
                                 availableSeats > 0 ? `${availableSeats} seats` : 'Full'}
                              </span>
                              
                              {enrolled ? (
                                <button
                                  onClick={() => handleUnregister(section.id)}
                                  className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                >
                                  Drop
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleRegister(section.id)}
                                  disabled={availableSeats === 0 || wouldExceed || enrolledSection}
                                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                  Enroll
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {!enrolledSection && wouldExceed && (
                    <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      Would exceed credit limit
                    </div>
                  )}
                  
                  {enrolledSection && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                      <CheckCircle className="h-3 w-3 inline mr-1" />
                      Enrolled in Section {enrolledSection.section || 'A'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search term.' : 'No courses are available yet.'}
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default StudentDashboard;