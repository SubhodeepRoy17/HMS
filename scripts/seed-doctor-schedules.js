// scripts/seed-doctor-schedules.js
const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://subhodeeproy37:Pr0t3ct3d@cluster0.lr9ar.mongodb.net/?appName=Cluster0';
const DB_NAME = 'hospital_management_system';

// Define time slots
const TIME_SLOTS = [
  { startTime: "09:00 AM", endTime: "10:00 AM", isAvailable: true, patientId: null, appointmentId: null },
  { startTime: "10:00 AM", endTime: "11:00 AM", isAvailable: true, patientId: null, appointmentId: null },
  { startTime: "11:00 AM", endTime: "12:00 PM", isAvailable: true, patientId: null, appointmentId: null },
  { startTime: "12:00 PM", endTime: "01:00 PM", isAvailable: true, patientId: null, appointmentId: null },
  { startTime: "02:00 PM", endTime: "03:00 PM", isAvailable: true, patientId: null, appointmentId: null },
  { startTime: "03:00 PM", endTime: "04:00 PM", isAvailable: true, patientId: null, appointmentId: null },
  { startTime: "04:00 PM", endTime: "05:00 PM", isAvailable: true, patientId: null, appointmentId: null },
  { startTime: "05:00 PM", endTime: "06:00 PM", isAvailable: true, patientId: null, appointmentId: null }
];

// Function to generate dates for next N days
function getNextDates(days) {
  const dates = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    dates.push(date);
  }
  return dates;
}

async function seedDoctorSchedules() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');
    
    const db = client.db(DB_NAME);
    
    // Get all doctors
    const doctors = await db.collection('users').find({ role: 'doctor' }).toArray();
    console.log(`\n📋 Found ${doctors.length} doctor(s) in database`);
    
    if (doctors.length === 0) {
      console.log('\n❌ No doctors found! Please create doctors first.');
      console.log('You can create a doctor using:');
      console.log('POST /api/auth/register with role: "doctor"');
      return;
    }
    
    // Display doctors found
    console.log('\n👨‍⚕️ Doctors:');
    doctors.forEach((doc, idx) => {
      console.log(`  ${idx + 1}. Dr. ${doc.firstName} ${doc.lastName} - ${doc.department || 'General Medicine'} (ID: ${doc._id})`);
    });
    
    // Generate dates for next 30 days
    const dates = getNextDates(30);
    console.log(`\n📅 Will create schedules for ${dates.length} days (next 30 days)`);
    
    let createdCount = 0;
    let existingCount = 0;
    
    // Create schedules for each doctor and date
    for (const doctor of doctors) {
      console.log(`\n📝 Processing Dr. ${doctor.firstName} ${doctor.lastName}...`);
      
      for (const date of dates) {
        // Check if schedule already exists
        const existing = await db.collection('doctorSchedules').findOne({
          doctorId: doctor._id,
          date: date
        });
        
        if (!existing) {
          // Create new schedule
          await db.collection('doctorSchedules').insertOne({
            doctorId: doctor._id,
            doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
            department: doctor.department || 'General Medicine',
            specialization: doctor.specialization || 'General Physician',
            date: date,
            timeSlots: TIME_SLOTS.map(slot => ({ ...slot })), // Clone the time slots
            createdAt: new Date(),
            updatedAt: new Date()
          });
          createdCount++;
        } else {
          existingCount++;
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ SEEDING COMPLETE!');
    console.log('='.repeat(50));
    console.log(`📊 Statistics:`);
    console.log(`   - Doctors: ${doctors.length}`);
    console.log(`   - Days scheduled: ${dates.length}`);
    console.log(`   - New schedules created: ${createdCount}`);
    console.log(`   - Existing schedules skipped: ${existingCount}`);
    console.log(`   - Total time slots per day: ${TIME_SLOTS.length}`);
    
    // Verify the data
    const totalSchedules = await db.collection('doctorSchedules').countDocuments();
    console.log(`\n📈 Total schedules in database: ${totalSchedules}`);
    
    // Show sample schedule
    const sampleSchedule = await db.collection('doctorSchedules').findOne({});
    if (sampleSchedule) {
      console.log('\n📋 Sample schedule:');
      console.log(`   Doctor: ${sampleSchedule.doctorName}`);
      console.log(`   Date: ${sampleSchedule.date.toDateString()}`);
      console.log(`   Time Slots: ${sampleSchedule.timeSlots.length} slots available`);
      console.log(`   First slot: ${sampleSchedule.timeSlots[0].startTime} - ${sampleSchedule.timeSlots[0].endTime}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error seeding doctor schedules:', error);
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the seed function
seedDoctorSchedules();