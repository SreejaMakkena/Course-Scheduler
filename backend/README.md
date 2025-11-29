# Course Scheduler Backend API

A comprehensive Node.js/Express backend for the Course Scheduler application with MongoDB integration.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Students, Teachers, and Admins with different permissions
- **Course Management**: Full CRUD operations with schedule conflict detection
- **Enrollment System**: Smart enrollment with credit limits and conflict checking
- **Data Validation**: Comprehensive input validation and sanitization
- **Security**: Rate limiting, CORS, helmet protection
- **Database**: MongoDB with Mongoose ODM

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## 🛠️ Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd course-scheduler-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Update the variables as needed:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/course-scheduler
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   - Make sure MongoDB is running on your system
   - Default connection: `mongodb://localhost:27017/course-scheduler`

5. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   
   # Or use the batch script (Windows)
   start-backend.bat
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@student.edu",
  "password": "password123",
  "role": "student",
  "department": "Computer Science",
  "year": 2,
  "studentId": "CS2024001"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@student.edu",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### User Management

#### Get All Users (Admin only)
```http
GET /api/users?page=1&limit=10&role=student&department=Computer Science
Authorization: Bearer <token>
```

#### Get User by ID
```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### Update User
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "maxCredits": 20
}
```

### Course Management

#### Get All Courses
```http
GET /api/courses?department=Computer Science&semester=Fall 2024
Authorization: Bearer <token>
```

#### Create Course (Admin only)
```http
POST /api/courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseCode": "CS301",
  "title": "Data Structures",
  "credits": 4,
  "department": "Computer Science",
  "section": "A",
  "coordinator": "teacher_id",
  "instructor": "teacher_id",
  "capacity": 30,
  "schedule": [
    {
      "day": "Monday",
      "period": "Period 1",
      "room": "CS-101"
    }
  ],
  "semester": "Fall 2024",
  "year": 2024
}
```

### Enrollment Management

#### Enroll in Course (Students only)
```http
POST /api/enrollments
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": "course_id"
}
```

#### Get Student Enrollments
```http
GET /api/enrollments/student/:studentId
Authorization: Bearer <token>
```

#### Drop Course
```http
DELETE /api/enrollments/:enrollmentId
Authorization: Bearer <token>
```

### Data Management (Admin only)

#### Seed Database
```http
POST /api/data/seed
Authorization: Bearer <token>
```

#### Get Statistics
```http
GET /api/data/stats
Authorization: Bearer <token>
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 👥 User Roles

### Student
- View available courses
- Enroll/drop courses
- View own enrollments and timetable
- Update own profile

### Teacher
- View assigned courses
- View enrolled students
- Update grades and enrollment status
- View course analytics

### Admin
- Full access to all endpoints
- User management
- Course management
- System statistics
- Data import/export

## 🛡️ Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: express-validator for all inputs
- **Rate Limiting**: Prevent API abuse
- **CORS**: Configurable cross-origin requests
- **Helmet**: Security headers
- **MongoDB Injection Protection**: Mongoose sanitization

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: ['student', 'teacher', 'admin'],
  department: String,
  year: Number (students only),
  studentId: String (students only),
  maxCredits: Number,
  assignedCourses: [ObjectId] (teachers only)
}
```

### Course Model
```javascript
{
  courseCode: String,
  title: String,
  description: String,
  credits: Number,
  department: String,
  section: String,
  coordinator: ObjectId,
  instructor: ObjectId,
  capacity: Number,
  enrolled: Number,
  schedule: [{
    day: String,
    period: String,
    room: String
  }],
  semester: String,
  year: Number,
  enrolledStudents: [ObjectId]
}
```

### Enrollment Model
```javascript
{
  student: ObjectId,
  course: ObjectId,
  status: ['enrolled', 'dropped', 'completed', 'failed'],
  enrollmentDate: Date,
  dropDate: Date,
  grade: String,
  credits: Number,
  semester: String,
  year: Number
}
```

## 🚦 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

## 📈 Monitoring

### Health Check
```http
GET /api/health
```

Returns server status and timestamp.

## 🔧 Development

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (to be implemented)

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/course-scheduler |
| JWT_SECRET | JWT signing secret | (required) |
| JWT_EXPIRE | JWT expiration time | 7d |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:3000 |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Check the API documentation above
- Review error messages in the response
- Check server logs for detailed error information
- Ensure MongoDB is running and accessible

## 🔄 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}, // Response data
  "pagination": {} // For paginated responses
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```