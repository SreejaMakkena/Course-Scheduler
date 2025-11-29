# Course Scheduler - Frontend-Only Web Application

## 📋 Project Overview

A comprehensive React-based course selection and scheduling system that operates entirely in the frontend using LocalStorage for data persistence. The application supports three distinct user roles with tailored dashboards and features.

## 🚀 Key Features

### ✅ **Complete Authentication System**
- User registration with role-based signup
- Secure login with demo accounts for testing
- Profile management and editing
- Role-based access control (Student, Teacher, Admin)

### ✅ **Student Portal**
- **Course Browsing**: Search and filter courses by department, credits, instructor
- **Smart Registration**: Automatic schedule conflict detection and credit limit enforcement
- **Visual Timetable**: Interactive weekly schedule with real-time updates
- **Credit Management**: Visual credit tracking with limit warnings
- **Notifications**: Real-time updates on registration status

### ✅ **Teacher Dashboard**
- **Course Management**: View assigned courses and enrolled students
- **Student Analytics**: Interactive charts showing enrollment statistics
- **Student Details**: Access individual student timetables and information
- **Performance Metrics**: Course utilization and department distribution analytics

### ✅ **Admin Dashboard**
- **Course CRUD**: Complete course creation, editing, and deletion
- **User Management**: Student credit limit administration
- **System Analytics**: Popular courses, enrollment trends, capacity utilization
- **Teacher Assignment**: Assign instructors to courses
- **Registration Oversight**: Monitor and manage system-wide registrations

## 🛠 Technical Implementation

### **Frontend Stack**
- **React.js**: Component-based UI with hooks and context
- **React Router**: Client-side routing and navigation
- **Tailwind CSS**: Responsive styling and modern UI components
- **Recharts**: Interactive charts and data visualization
- **Lucide React**: Modern icon library
- **React Hot Toast**: User-friendly notifications

### **Data Management**
- **LocalStorage**: Persistent data storage without backend
- **Context API**: Global state management for authentication
- **Mock Data**: Realistic sample data for demonstration
- **Data Service**: Centralized data operations and business logic

### **Key Components**

#### **Authentication System**
```javascript
// AuthContext.jsx - Global authentication state
// Login.jsx - User login with demo accounts
// Register.jsx - New user registration with validation
// UserProfile.jsx - Profile editing and management
```

#### **Dashboard Components**
```javascript
// StudentDashboard.jsx - Course browsing and registration
// TeacherDashboard.jsx - Course and student management
// AdminDashboard.jsx - System administration
```

#### **Shared Components**
```javascript
// Layout.jsx - Navigation and user interface
// Timetable.jsx - Visual schedule rendering
// CreditSummary.jsx - Credit tracking display
// NotificationCenter.jsx - Real-time notifications
```

#### **Data Layer**
```javascript
// dataService.js - LocalStorage operations and business logic
// mockData.js - Initial data and configuration
```

## 📊 Data Structure

### **User Object**
```javascript
{
  id: number,
  name: string,
  email: string,
  password: string,
  role: 'student' | 'teacher' | 'admin',
  department: string,
  year?: number, // Students only
  studentId?: string, // Students only
  maxCredits?: number, // Students only (default: 18)
  enrolledCourses?: array, // Students only
  assignedCourses?: array, // Teachers only
  phone?: string,
  isActive: boolean,
  createdAt: string
}
```

### **Course Object**
```javascript
{
  id: number,
  courseCode: string,
  title: string,
  description: string,
  credits: number,
  department: string,
  instructor: number, // User ID
  capacity: number,
  enrolled: number,
  schedule: [{
    day: string,
    startTime: string,
    endTime: string,
    room: string
  }],
  prerequisites: array,
  semester: string,
  year: number,
  isActive: boolean
}
```

### **Registration Object**
```javascript
{
  id: number,
  studentId: number,
  courseId: number,
  status: 'enrolled',
  registrationDate: string
}
```

## 🔧 Business Logic

### **Schedule Conflict Detection**
- Compares time slots across different days
- Prevents overlapping course registrations
- Real-time validation during registration

### **Credit Limit Enforcement**
- Configurable per-student credit limits
- Automatic validation during course registration
- Visual warnings and progress tracking
- Admin override capabilities

### **Seat Management**
- Real-time capacity tracking
- Automatic enrollment updates
- Waitlist functionality (framework ready)

## 🎨 User Interface Design

### **Academic Theme**
- University campus background imagery
- Professional color scheme (blues, grays, whites)
- Card-based layout with hover effects
- Responsive design for all screen sizes

### **Interactive Elements**
- Animated progress bars for credit tracking
- Hover effects on course cards
- Modal dialogs for forms and details
- Toast notifications for user feedback

### **Accessibility Features**
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly
- High contrast color ratios

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Tablet Support**: Adapted layouts for medium screens
- **Desktop Enhanced**: Full feature set on large screens
- **Grid Layouts**: Flexible responsive grid systems

## 🔐 Security Features

- **Input Validation**: Client-side form validation
- **Data Sanitization**: Clean user inputs
- **Role-based Access**: Protected routes and components
- **Session Management**: Persistent login state

## 🚀 Getting Started

### **Installation**
```bash
# Clone or download the project
cd course-scheduler

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### **Demo Accounts**
- **Student**: john@student.edu / password123
- **Teacher**: sarah@teacher.edu / password123
- **Admin**: admin@university.edu / password123

### **Creating New Accounts**
1. Visit the registration page
2. Choose your role (Student/Teacher/Admin)
3. Fill in required information
4. Submit and login with new credentials

## 📈 Analytics & Reporting

### **Student Analytics**
- Credit utilization tracking
- Course enrollment history
- Schedule optimization suggestions

### **Teacher Analytics**
- Course enrollment statistics
- Student department distribution
- Academic year breakdowns
- Interactive charts and graphs

### **Admin Analytics**
- System-wide enrollment trends
- Popular course identification
- Capacity utilization metrics
- Department performance analysis

## 🔄 Data Flow

1. **User Registration/Login** → LocalStorage authentication
2. **Course Browsing** → Filter and search operations
3. **Registration Process** → Validation and conflict checking
4. **Data Updates** → Real-time LocalStorage synchronization
5. **Analytics Generation** → Dynamic calculation from stored data

## 🎯 Future Enhancements

### **Planned Features**
- Email notifications (mock implementation)
- Advanced scheduling algorithms
- Course recommendation system
- Grade management integration
- Mobile app version
- Offline functionality

### **Technical Improvements**
- Performance optimization
- Advanced caching strategies
- Enhanced error handling
- Comprehensive testing suite
- Accessibility improvements

## 🐛 Known Limitations

- **Data Persistence**: Limited to browser LocalStorage
- **Concurrent Users**: No real-time synchronization
- **Data Backup**: Manual export/import required
- **Scalability**: Suitable for demonstration purposes

## 📞 Support & Documentation

### **User Guides**
- Student registration walkthrough
- Teacher dashboard tutorial
- Admin management guide
- Troubleshooting common issues

### **Technical Documentation**
- Component API reference
- Data service methods
- Styling guidelines
- Deployment instructions

---

**Built with ❤️ using React.js and modern web technologies**