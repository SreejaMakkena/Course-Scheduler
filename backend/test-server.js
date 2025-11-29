const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const testConnection = async () => {
  try {
    console.log('🔍 Testing Course Scheduler Backend...\n');
    
    // Test MongoDB connection
    console.log('📊 Testing MongoDB connection...');
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/course-scheduler', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Test database operations
    console.log('\n🧪 Testing database operations...');
    
    // Test collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Available collections: ${collections.map(c => c.name).join(', ') || 'None (empty database)'}`);
    
    // Test models
    const User = require('./models/User');
    const Course = require('./models/Course');
    const Enrollment = require('./models/Enrollment');
    
    console.log('📋 Models loaded successfully:');
    console.log('   - User model ✅');
    console.log('   - Course model ✅');
    console.log('   - Enrollment model ✅');
    
    // Count documents
    const userCount = await User.countDocuments();
    const courseCount = await Course.countDocuments();
    const enrollmentCount = await Enrollment.countDocuments();
    
    console.log('\n📊 Database Statistics:');
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Courses: ${courseCount}`);
    console.log(`   - Enrollments: ${enrollmentCount}`);
    
    console.log('\n🎉 Backend test completed successfully!');
    console.log('\n🚀 Ready to start the server with: npm run dev');
    console.log('📚 API will be available at: http://localhost:5000/api');
    console.log('🔍 Health check: http://localhost:5000/api/health');
    
    if (userCount === 0) {
      console.log('\n💡 Tip: Use POST /api/data/seed to populate the database with sample data');
    }
    
  } catch (error) {
    console.error('❌ Backend test failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 MongoDB Connection Issue:');
      console.log('   1. Make sure MongoDB is installed and running');
      console.log('   2. Check if MongoDB service is started');
      console.log('   3. Verify connection string in .env file');
      console.log('   4. Default: mongodb://localhost:27017/course-scheduler');
    }
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

testConnection();