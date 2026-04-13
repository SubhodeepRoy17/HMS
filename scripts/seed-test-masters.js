const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'hospital_management_system';

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db(DB_NAME);
    
    // 1. Create counters collection
    console.log('Creating counters...');
    await db.collection('counters').insertMany([
      { _id: 'patientId', seq: 0 },
      { _id: 'registrationNumber', seq: 0 },
      { _id: 'appointmentId', seq: 0 },
      { _id: 'billNumber', seq: 0 },
      { _id: 'receiptNumber', seq: 0 },
      { _id: 'investigationId', seq: 0 },
      { _id: 'opdCardNumber', seq: 0 },
    ], { ordered: false }).catch(() => console.log('Counters already exist'));

    // 2. Create test masters
    console.log('Creating test masters...');
    const testMasters = [
      {
        testCode: 'CBC001',
        testName: 'Complete Blood Count',
        category: 'Hematology',
        department: 'Pathology',
        parameters: [
          { name: 'Hemoglobin', unit: 'g/dL', referenceRange: 'M: 13.5-17.5, F: 12.0-15.5', isNumeric: true },
          { name: 'WBC', unit: 'cells/μL', referenceRange: '4500-11000', isNumeric: true },
          { name: 'RBC', unit: 'million/μL', referenceRange: 'M: 4.5-5.9, F: 4.1-5.1', isNumeric: true },
          { name: 'Platelets', unit: 'thousand/μL', referenceRange: '150-400', isNumeric: true },
        ],
        price: 500,
        turnAroundTime: '4 hours',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        testCode: 'LFT001',
        testName: 'Liver Function Test',
        category: 'Biochemistry',
        department: 'Pathology',
        parameters: [
          { name: 'Total Bilirubin', unit: 'mg/dL', referenceRange: '0.1-1.2', isNumeric: true },
          { name: 'SGOT', unit: 'U/L', referenceRange: '10-40', isNumeric: true },
          { name: 'SGPT', unit: 'U/L', referenceRange: '7-56', isNumeric: true },
          { name: 'Alkaline Phosphatase', unit: 'U/L', referenceRange: '30-120', isNumeric: true },
        ],
        price: 800,
        turnAroundTime: '6 hours',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        testCode: 'KFT001',
        testName: 'Kidney Function Test',
        category: 'Biochemistry',
        department: 'Pathology',
        parameters: [
          { name: 'Creatinine', unit: 'mg/dL', referenceRange: 'M: 0.7-1.3, F: 0.6-1.2', isNumeric: true },
          { name: 'BUN', unit: 'mg/dL', referenceRange: '7-20', isNumeric: true },
          { name: 'Uric Acid', unit: 'mg/dL', referenceRange: 'M: 3.4-7.0, F: 2.4-6.0', isNumeric: true },
        ],
        price: 600,
        turnAroundTime: '4 hours',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    
    for (const test of testMasters) {
      await db.collection('testMasters').updateOne(
        { testCode: test.testCode },
        { $set: test },
        { upsert: true }
      );
    }
    
    // 3. Create rooms
    console.log('Creating rooms...');
    const rooms = [
      { roomNumber: '101', floor: 1, roomType: 'General', bedCount: 4, availableBeds: 4, dailyRate: 1000, amenities: ['TV', 'Attached Bathroom'], isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { roomNumber: '102', floor: 1, roomType: 'General', bedCount: 4, availableBeds: 4, dailyRate: 1000, amenities: ['TV', 'Attached Bathroom'], isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { roomNumber: '201', floor: 2, roomType: 'Private', bedCount: 1, availableBeds: 1, dailyRate: 3000, amenities: ['TV', 'AC', 'Attached Bathroom', 'WiFi'], isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { roomNumber: '202', floor: 2, roomType: 'Private', bedCount: 1, availableBeds: 1, dailyRate: 3000, amenities: ['TV', 'AC', 'Attached Bathroom', 'WiFi'], isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { roomNumber: 'ICU-01', floor: 3, roomType: 'ICU', bedCount: 6, availableBeds: 6, dailyRate: 5000, amenities: ['Monitor', 'Ventilator', 'Attached Bathroom'], isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ];
    
    for (const room of rooms) {
      await db.collection('rooms').updateOne(
        { roomNumber: room.roomNumber },
        { $set: room },
        { upsert: true }
      );
    }
    
    // 4. Create departments
    console.log('Creating departments...');
    const departments = [
      { name: 'Cardiology', code: 'CARD', description: 'Heart care', isActive: true },
      { name: 'Neurology', code: 'NEUR', description: 'Nervous system', isActive: true },
      { name: 'Orthopedics', code: 'ORTH', description: 'Bone and joint care', isActive: true },
      { name: 'General Medicine', code: 'GENM', description: 'General medical care', isActive: true },
      { name: 'Pediatrics', code: 'PED', description: 'Child care', isActive: true },
      { name: 'Gynecology', code: 'GYN', description: 'Women\'s health', isActive: true },
      { name: 'Dermatology', code: 'DERM', description: 'Skin care', isActive: true },
      { name: 'Ophthalmology', code: 'OPTH', description: 'Eye care', isActive: true },
    ];
    
    for (const dept of departments) {
      await db.collection('departments').updateOne(
        { code: dept.code },
        { $set: dept },
        { upsert: true }
      );
    }
    
    // 5. Create service charges
    console.log('Creating service charges...');
    const serviceCharges = [
      { category: 'consultation', patientType: 'General', baseRate: 200, timeMultiplier: 1, emergencyMultiplier: 1.5, createdAt: new Date(), updatedAt: new Date() },
      { category: 'consultation', patientType: 'VIP', baseRate: 400, timeMultiplier: 1, emergencyMultiplier: 1.5, createdAt: new Date(), updatedAt: new Date() },
      { category: 'consultation', patientType: 'Insurance', baseRate: 180, timeMultiplier: 1, emergencyMultiplier: 1.5, createdAt: new Date(), updatedAt: new Date() },
      { category: 'consultation', patientType: 'Panel', baseRate: 150, timeMultiplier: 1, emergencyMultiplier: 1.5, createdAt: new Date(), updatedAt: new Date() },
      { category: 'pathology', patientType: 'General', baseRate: 300, timeMultiplier: 1, emergencyMultiplier: 1.5, createdAt: new Date(), updatedAt: new Date() },
      { category: 'pathology', patientType: 'VIP', baseRate: 600, timeMultiplier: 1, emergencyMultiplier: 1.5, createdAt: new Date(), updatedAt: new Date() },
      { category: 'imaging', patientType: 'General', baseRate: 500, timeMultiplier: 1, emergencyMultiplier: 1.5, createdAt: new Date(), updatedAt: new Date() },
      { category: 'imaging', patientType: 'VIP', baseRate: 1000, timeMultiplier: 1, emergencyMultiplier: 1.5, createdAt: new Date(), updatedAt: new Date() },
    ];
    
    for (const charge of serviceCharges) {
      await db.collection('serviceCharges').updateOne(
        { category: charge.category, patientType: charge.patientType },
        { $set: charge },
        { upsert: true }
      );
    }
    
    console.log('✅ Database seeded successfully!');
    console.log('Collections created:');
    console.log('  - counters');
    console.log('  - testMasters');
    console.log('  - rooms');
    console.log('  - departments');
    console.log('  - serviceCharges');
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

// Run the seed function
seedDatabase();