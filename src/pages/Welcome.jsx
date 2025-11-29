import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Calendar, BarChart3 } from 'lucide-react';

const Welcome = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-4xl">
          <div className="flex justify-center mb-8">
            <BookOpen className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-5xl md:text-6xl font-light text-gray-900 mb-6">
            Course Scheduler
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Simple and efficient course management for students, teachers, and administrators
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              to="/login"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Create Account
            </Link>
          </div>
          
          {/* Simple Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="text-center">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">For Everyone</h3>
              <p className="text-gray-600">Students, teachers, and administrators</p>
            </div>
            <div className="text-center">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Smart Scheduling</h3>
              <p className="text-gray-600">Automatic conflict detection</p>
            </div>
            <div className="text-center">
              <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics</h3>
              <p className="text-gray-600">Track enrollment and progress</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;