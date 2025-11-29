# Course Scheduler

A full-stack course scheduling application built with React and Node.js.

## Features

- **Student Dashboard**: Browse and register for courses
- **Teacher Dashboard**: View assigned courses and enrolled students
- **Admin Dashboard**: Manage courses, teachers, and system settings
- **Authentication**: Secure login/register system
- **Real-time Updates**: Backend API integration

## Tech Stack

### Frontend
- React 19
- React Router DOM
- Tailwind CSS (via classes)
- Lucide React (icons)
- React Hot Toast (notifications)
- Recharts (analytics)

### Backend
- Node.js
- Express.js
- JWT Authentication
- bcryptjs (password hashing)
- CORS enabled

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd course-scheduler
```

2. Install dependencies:
```bash
npm install
cd backend && npm install
```

3. Start development servers:
```bash
npm run dev
```

This will start:
- Frontend on http://localhost:5173
- Backend on http://localhost:3001

### Production Build

```bash
npm run build
npm run build:server
```

## Deployment

### Heroku

1. Create a Heroku app:
```bash
heroku create your-app-name
```

2. Set environment variables:
```bash
heroku config:set NODE_ENV=production
```

3. Deploy:
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### Other Platforms

The app is configured to work with any platform that supports Node.js:
- Render
- Railway
- Vercel
- Netlify

## Default Users

- **Admin**: admin@university.edu / 1234567890
- **Teacher**: lakshman@teacher.edu / 1234567890  
- **Student**: sreeja@student.edu / 1234567890

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create course (admin only)
- `PUT /api/courses/:id` - Update course (admin only)

### Enrollments
- `POST /api/enrollments` - Enroll in course
- `GET /api/enrollments/student/:id` - Get student enrollments

## Project Structure

```
course-scheduler/
├── public/                 # React public files
├── src/                   # React source code
│   ├── components/        # Reusable components
│   ├── pages/            # Page components
│   ├── services/         # API services
│   ├── context/          # React context
│   └── data/             # Static data
├── backend/              # Node.js backend
│   ├── src/              # Server source
│   ├── routes/           # API routes
│   └── package.json      # Backend dependencies
├── build/                # Production build
└── package.json          # Frontend dependencies
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.