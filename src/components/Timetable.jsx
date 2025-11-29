import React, { useState, useEffect } from 'react';
import { days, timeSlots, periodTimes } from '../data/mockData';
import apiService from '../services/api';

const Timetable = ({ studentId }) => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  useEffect(() => {
    loadEnrolledCourses();
  }, [studentId]);

  useEffect(() => {
    // Listen for storage changes to refresh when courses are updated
    const handleStorageChange = () => {
      loadEnrolledCourses();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also refresh every 2 seconds to catch localStorage changes from same tab
    const interval = setInterval(loadEnrolledCourses, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const loadEnrolledCourses = () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    
    const student = users.find(u => u.id === studentId && u.role === 'student');
    if (!student || !student.enrolledCourses) {
      setEnrolledCourses([]);
      return;
    }

    const studentCourses = courses.filter(course => 
      student.enrolledCourses.includes(course.id)
    );
    
    setEnrolledCourses(studentCourses);
  };

  
  const getCoursesForSlot = (day, period) => {
    return enrolledCourses.filter(course => {
      return course.schedule && course.schedule.some(slot => {
        return slot.day === day && slot.period === period;
      });
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Timetable</h3>
      
      <div className="timetable-container">
        <div className="timetable-grid">
          {/* Header row */}
          <div className="time-header">Time</div>
          {days.map(day => (
            <div key={day} className="day-header">
              {day.substring(0, 3)}
            </div>
          ))}
          
          {/* Period slots */}
          {timeSlots.map(period => (
            <React.Fragment key={period}>
              <div className="time-header">
                <div className="font-semibold">{period}</div>
                <div className="text-xs text-gray-500">{periodTimes[period]}</div>
              </div>
              {days.map(day => {
                const coursesInSlot = getCoursesForSlot(day, period);
                return (
                  <div key={`${day}-${period}`} className="time-slot">
                    {coursesInSlot.map(course => {
                      const scheduleInfo = course.schedule.find(s => s.day === day && s.period === period);
                      return (
                        <div
                          key={course.id}
                          className="course-block"
                          title={`${course.title} - ${scheduleInfo?.room || 'TBA'} - Section ${course.section || 'A'}`}
                        >
                          <div className="font-semibold">{course.courseCode}</div>
                          <div className="text-xs">{scheduleInfo?.room || 'TBA'}</div>
                          <div className="text-xs">Sec {course.section || 'A'}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Enrolled Courses:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {enrolledCourses.map(course => (
            <div key={course.id} className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span className="text-sm">
                {course.courseCode} - {course.title} ({course.credits} credits)
                <span className="section-badge">Sec {course.section || 'A'}</span>
              </span>
            </div>
          ))}
        </div>
        {enrolledCourses.length === 0 && (
          <p className="text-gray-500 text-sm">No courses enrolled yet.</p>
        )}
      </div>
    </div>
  );
};

export default Timetable;