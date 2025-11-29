# Deployment Guide

## Quick Setup

### 1. Development Mode
```bash
# Install dependencies
npm install
cd backend && npm install && cd ..

# Run both frontend and backend
npm run dev
```

### 2. Production Build
```bash
# Build the React app
npm run build

# The backend will serve the built React app
cd backend && npm start
```

## Deployment Options

### Option 1: Heroku (Recommended)

1. **Create Heroku App**
```bash
heroku create your-course-scheduler
```

2. **Set Environment Variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key
```

3. **Deploy**
```bash
git push heroku main
```

### Option 2: Render

1. Connect your GitHub repository to Render
2. Set build command: `npm run heroku-postbuild`
3. Set start command: `cd backend && npm start`
4. Set environment variables in Render dashboard

### Option 3: Railway

1. Connect GitHub repository
2. Railway will auto-detect the Node.js app
3. Set environment variables in Railway dashboard

### Option 4: Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

## Environment Variables

Create `.env` files in both root and backend directories:

**Root `.env`:**
```
REACT_APP_API_URL=http://localhost:3001/api
```

**Backend `.env`:**
```
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key-here
```

## File Structure After Setup

```
course-scheduler/
├── public/                 # React public files
├── src/                   # React source
├── backend/              # Node.js backend
│   ├── src/server.js     # Main server file
│   ├── routes/           # API routes
│   └── package.json      # Backend deps
├── build/                # React production build
├── Procfile              # Heroku config
├── package.json          # Frontend deps + scripts
└── README.md
```

## Testing Deployment

1. **Local Production Test:**
```bash
npm run build
cd backend && npm start
# Visit http://localhost:3001
```

2. **Check API Endpoints:**
- http://localhost:3001/api/test
- http://localhost:3001/api/auth/login

## Troubleshooting

### Common Issues:

1. **Port Issues**: Make sure PORT environment variable is set
2. **Build Errors**: Run `npm run build` locally first
3. **API Errors**: Check backend logs for detailed error messages
4. **CORS Issues**: Ensure CORS is properly configured in backend

### Debug Commands:
```bash
# Check if backend is running
curl http://localhost:3001/api/test

# Check build files
ls -la build/

# Check backend dependencies
cd backend && npm list
```

## Production Checklist

- [ ] Environment variables set
- [ ] Build completes successfully
- [ ] Backend serves React app
- [ ] API endpoints working
- [ ] Authentication working
- [ ] Database/data persistence working
- [ ] Error handling in place
- [ ] Logs configured

## Default Login Credentials

- **Admin**: admin@university.edu / 1234567890
- **Teacher**: lakshman@teacher.edu / 1234567890
- **Student**: sreeja@student.edu / 1234567890