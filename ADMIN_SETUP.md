# HMS Admin Setup Guide

## Default Admin Credentials

The Hospital Management System comes with a default admin account that can be seeded into the database.

**Email:** `admin@hms.com`  
**Password:** `hms2026`

## Setup Instructions

### 1. Configure MongoDB Connection

Before running the seed script, ensure `.env.local` has the correct MongoDB URI:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and replace `YOUR_ACTUAL_PASSWORD_HERE` with your MongoDB Atlas password.

### 2. Run the Seed Script

To create the default admin user:

```bash
npx ts-node scripts/seed-admin.ts
```

Expected output:
```
🌱 Seeding default admin user...
✅ Admin user created successfully!
   Email: admin@hms.com
   Password: hms2026
   ID: <mongodb_id>
```

### 3. Login to Admin Dashboard

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth`

3. Login with:
   - Email: `admin@hms.com`
   - Password: `hms2026`

4. You'll be redirected to `http://localhost:3000/admin/dashboard`

## Admin Dashboard Features

The admin dashboard now displays three separate role-based tables:

### 1. **Doctors Table**
- Name, Email, Department, Specialization, Phone, Status
- Add new doctors with their specialization
- View/Edit doctor details

### 2. **Patients Table**
- Name, Email, Phone, Last Login, Status
- Add new patients
- View/Edit patient records

### 3. **Receptionists Table**
- Name, Email, Phone, Last Login, Status
- Add new receptionists
- View/Edit receptionist details

### 4. **Dashboard Metrics**
- Total Users, Doctors, Patients, Receptionists
- Appointment statistics
- User distribution pie chart
- Appointment status bar chart
- Revenue trend line chart

## Notes

- Only ONE admin account exists in the system
- The admin email is fixed to `admin@hms.com`
- To reset the admin password, you'll need to update the database directly or create a password reset endpoint
- All other users (doctors, patients, receptionists) can be managed through the admin dashboard
