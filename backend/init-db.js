require('dotenv').config();
const { connectDB } = require('./src/data');

async function initDatabase() {
  console.log('🚀 Initializing database...');
  await connectDB();
  console.log('✅ Database initialized!');
  process.exit(0);
}

initDatabase().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});