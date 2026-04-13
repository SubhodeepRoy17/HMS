/**
 * Seed script to create default admin user
 * Run with: node scripts/seed-admin.js
 */

require('dotenv').config({ path: '.env.local' });

const { MongoClient } = require('mongodb');
const bcryptjs = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGO_DB_NAME || 'hospital_management_system';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

const DEFAULT_ADMIN = {
  firstName: 'System',
  lastName: 'Administrator',
  email: 'admin@hms.com',
  password: 'hms2026',
  phone: '+1-800-HMS-2026',
  role: 'admin',
  isActive: true,
  isEmailVerified: true,
};

async function seedAdmin() {
  let client;
  try {
    console.log('🌱 Seeding default admin user...');
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Check if admin already exists
    const existingAdmin = await db.collection('users').findOne({ email: DEFAULT_ADMIN.email });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      await client.close();
      return;
    }
    
    // Hash password
    const hashedPassword = await bcryptjs.hash(DEFAULT_ADMIN.password, 10);
    
    // Create admin user
    const result = await db.collection('users').insertOne({
      ...DEFAULT_ADMIN,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log('✅ Admin user created successfully!');
    console.log(`   Email: ${DEFAULT_ADMIN.email}`);
    console.log(`   Password: ${DEFAULT_ADMIN.password}`);
    console.log(`   ID: ${result.insertedId}`);
    
    await client.close();
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    process.exit(1);
  }
}

seedAdmin();
