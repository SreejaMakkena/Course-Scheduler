import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import UserProfile from './UserProfile';
import NotificationCenter from './NotificationCenter';
import { BookOpen, User, LogOut, Settings } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-light text-gray-900">
                Course Scheduler
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {user?.name} ({user?.role})
                </span>
              </div>
              
              <button
                onClick={() => setShowProfile(true)}
                className="p-2 text-gray-600 hover:text-gray-900 relative"
                title="Edit Profile"
              >
                <Settings className="h-5 w-5" />
              </button>
              
              <NotificationCenter />
              
              <button
                onClick={logout}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      
      <UserProfile 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
      />
    </div>
  );
};

export default Layout;