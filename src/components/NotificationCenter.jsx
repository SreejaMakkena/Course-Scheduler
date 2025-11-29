import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const NotificationCenter = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      generateNotifications();
    }
  }, [user]);

  const generateNotifications = () => {
    const mockNotifications = [];
    
    if (user.role === 'student') {
      const currentCredits = apiService.getStudentCredits(user.id);
      const maxCredits = user.maxCredits || 18;
      
      if (currentCredits > maxCredits) {
        mockNotifications.push({
          id: 1,
          type: 'error',
          title: 'Credit Limit Exceeded',
          message: `You are ${currentCredits - maxCredits} credits over your limit of ${maxCredits}.`,
          timestamp: new Date().toISOString(),
          read: false
        });
      } else if (currentCredits === maxCredits) {
        mockNotifications.push({
          id: 2,
          type: 'warning',
          title: 'Credit Limit Reached',
          message: `You have reached your credit limit of ${maxCredits} credits.`,
          timestamp: new Date().toISOString(),
          read: false
        });
      }
      
      mockNotifications.push({
        id: 3,
        type: 'success',
        title: 'Registration Successful',
        message: 'You have successfully registered for Data Structures and Algorithms.',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        read: false
      });
      
      mockNotifications.push({
        id: 4,
        type: 'info',
        title: 'New Course Available',
        message: 'Advanced Machine Learning course is now available for registration.',
        timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        read: true
      });
    }
    
    if (user.role === 'teacher') {
      mockNotifications.push({
        id: 5,
        type: 'info',
        title: 'New Student Enrollment',
        message: 'A new student has enrolled in your Database Management course.',
        timestamp: new Date().toISOString(),
        read: false
      });
    }
    
    if (user.role === 'admin') {
      mockNotifications.push({
        id: 6,
        type: 'warning',
        title: 'Course Capacity Alert',
        message: 'Physics II course is at 90% capacity.',
        timestamp: new Date().toISOString(),
        read: false
      });
    }
    
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = (now - time) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="p-2 text-gray-600 hover:text-gray-900 relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    {getIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className={`text-sm font-medium text-gray-900 ${
                          !notification.read ? 'font-semibold' : ''
                        }`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;