# Doctor Module Frontend - Comprehensive Overview

## 📁 Directory Structure

```
app/doctor/
├── layout.tsx                  (Main layout with Header + Sidebar)
├── sidebar.tsx                 (Doctor navigation sidebar)
├── dashboard/
│   └── page.tsx               (Dashboard - Overview of appointments & patients)
├── appointments/
│   └── page.tsx               (Appointment management - Today/Upcoming/Past)
├── medical-records/
│   └── page.tsx               (Medical records - View/Search/Upload)
└── prescriptions/
    └── page.tsx               (Prescription management - Active/History/Create)
```

---

## 🎯 Module Overview

The Doctor Module is a comprehensive patient and appointment management interface designed for medical professionals. All pages are currently using **mock data** and require backend integration.

---

## 📄 Page-by-Page Analysis

### 1. **Dashboard** (`dashboard/page.tsx`)

**Purpose**: Quick overview of the doctor's workday

**State & Data Structures**:
```typescript
interface Appointment {
  id: string
  patientName: string
  patientId: string
  time: string
  reason: string
  status: 'scheduled' | 'in-progress' | 'completed'
}

interface PatientRecord {
  id: string
  name: string
  lastVisit: string
  nextAppointment: string
  status: 'stable' | 'monitoring' | 'critical'
}

interface ActivityItem {
  id: string
  type: 'appointment' | 'note' | 'prescription' | 'alert'
  description: string
  timestamp: string
  severity?: 'low' | 'medium' | 'high'
}
```

**UI Components Used**:
- Card, CardHeader, CardTitle, CardDescription, CardContent
- Badge (with color variants for status)
- Tabs (likely for filtering)
- Icons: Users, Calendar, ClipboardList, AlertCircle, CheckCircle2, Clock, etc.

**Data Displayed**:
- **Appointments Section**: 4 mock appointments with status badges
- **Patient Records**: 4 mock patients with last visit, next appointment, status
- **Activity Feed**: 4 mock activity items (appointment, prescription, note, alert)

**Mock Data Count**: 12 total items (4 appointments, 4 patients, 4 activities)

**Key UI Elements**:
- Status badges (Scheduled, In Progress, Completed)
- Patient status indicators (Stable, Monitoring, Critical)
- Activity severity indicators (Low, Medium, High)
- Responsive grid layout

---

### 2. **Appointments** (`appointments/page.tsx`)

**Purpose**: Comprehensive appointment management and scheduling

**State & Data Structures**:
```typescript
interface Appointment {
  id: string
  patientName: string
  time: string
  reason: string
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
}
```

**UI Components Used**:
- Tabs (Today/Upcoming/Past)
- Card with CardHeader/CardContent
- Badge (status indicators)
- Button (View Details, Reschedule, View Notes)
- Icons: Calendar, Clock, User

**Tabs & Features**:

1. **Today Tab**:
   - Lists today's appointments
   - Shows: Patient name, time, reason, status
   - Action: "View Details" button
   - Mock data: 3 appointments

2. **Upcoming Tab**:
   - Future appointments (sample: April 1-2)
   - Shows: Patient name, date, time, reason
   - Action: "Reschedule" button
   - Mock data: 2 appointments

3. **Past Tab**:
   - Historical appointments
   - Shows: Patient name, date, reason
   - Action: "View Notes" button
   - Mock data: 2 appointments

**Status Values**: scheduled, in-progress, completed, cancelled

---

### 3. **Medical Records** (`medical-records/page.tsx`)

**Purpose**: Access, search, and manage patient medical records

**State & Data Structures**:
```typescript
interface MedicalRecord {
  id: string
  patientName: string
  recordType: string
  date: string
  description: string
  status: 'active' | 'archived' | 'under-review'
}
```

**UI Components Used**:
- Search input with icon
- Tabs (All Records/Clinical Notes/Test Results/Upload Record)
- Card with CardHeader/CardContent
- Badge (status indicators)
- Button (View, Edit)
- Icon: FileText, Search

**Tabs & Features**:

1. **All Records Tab**:
   - Displays all medical records
   - Shows: Patient name, record type, date, description, status
   - Action: "View" button
   - Mock data: 3 records

2. **Clinical Notes Tab**:
   - Filtered view of clinical notes only
   - Action: "Edit" button
   - Mock data: 1 (filtered from all records)

3. **Test Results Tab**:
   - Filtered view of test results
   - Shows: Patient name, date, description
   - Mock data: 1 (filtered from all records)

4. **Upload Record Tab**:
   - Form to upload new medical records
   - Fields:
     - Patient Name (text input)
     - Record Type (select dropdown)
     - File input
   - Action: "Upload Record" button

**Record Types**: Clinical Notes, Test Results, Diagnosis

**Search Feature**:
- Search by patient name or record ID
- Currently not connected to data filtering

---

### 4. **Prescriptions** (`prescriptions/page.tsx`)

**Purpose**: Create and manage patient prescriptions

**State & Data Structures**:
```typescript
interface Prescription {
  id: string
  patientName: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  date: string
  status: 'active' | 'completed' | 'discontinued'
}
```

**UI Components Used**:
- Tabs (Active/History/Create New)
- Card with CardHeader/CardContent
- Badge (status indicators)
- Button (Edit)
- Icon: Pill, Plus

**Tabs & Features**:

1. **Active Tab**:
   - Lists currently active prescriptions
   - Displays as grid: Medication | Dosage & Frequency | Duration | Date
   - Shows: Patient name, medication details, status badge
   - Action: "Edit" button
   - Mock data: 3 active prescriptions

2. **History Tab**:
   - Past and discontinued prescriptions
   - Shows: Patient name, medication, dosage, date, status
   - Mock data: Filtered to show non-active (can be populated)

3. **Create New Tab**:
   - Form to create new prescription
   - Fields:
     - Patient Name (text)
     - Medication Name (text)
     - Dosage (text, e.g., "500mg")
     - Frequency (text, e.g., "Twice daily")
     - Duration (text, e.g., "30 days")
     - Date (date input)
     - Additional notes/instructions (textarea)
   - Action: "Create Prescription" button (full width)

**Status Values**: active, completed, discontinued

**Medication Examples** (from mock data):
- Lisinopril 10mg
- Metformin 500mg
- Aspirin 100mg

---

## 🔗 API Calls & Integration Points

### Currently Missing Backend Integrations

All pages currently use hardcoded mock data. The following API endpoints need to be created:

#### **1. Appointments Endpoints**

```
GET  /api/doctor/appointments           - Get all appointments for doctor
GET  /api/doctor/appointments/today     - Get today's appointments
GET  /api/doctor/appointments/:id       - Get single appointment details
POST /api/doctor/appointments           - Create new appointment
PUT  /api/doctor/appointments/:id       - Update appointment
DELETE /api/doctor/appointments/:id     - Cancel appointment
PUT  /api/doctor/appointments/:id/status - Update appointment status
```

**Required Fields**:
- patientId, patientName, time, reason, status, date, notes

---

#### **2. Medical Records Endpoints**

```
GET    /api/doctor/medical-records              - List all records (with search/filter)
GET    /api/doctor/medical-records?type=        - Filter by record type
GET    /api/doctor/medical-records/:id          - Get single record
POST   /api/doctor/medical-records              - Upload new record (multipart/form-data)
PUT    /api/doctor/medical-records/:id          - Update record
DELETE /api/doctor/medical-records/:id          - Delete/archive record
```

**Required Fields**:
- patientId, patientName, recordType, date, description, file, status

**Record Types to Support**:
- Clinical Notes
- Test Results
- Diagnosis
- Lab Reports
- Imaging Results

---

#### **3. Prescriptions Endpoints**

```
GET  /api/doctor/prescriptions           - Get all prescriptions
GET  /api/doctor/prescriptions/active    - Get active prescriptions only
GET  /api/doctor/prescriptions/:id       - Get single prescription
POST /api/doctor/prescriptions           - Create new prescription
PUT  /api/doctor/prescriptions/:id       - Update prescription
DELETE /api/doctor/prescriptions/:id     - Delete/discontinue prescription
```

**Required Fields**:
- patientId, patientName, medication, dosage, frequency, duration, date, notes, status

---

#### **4. Patient Lookup Endpoints**

```
GET /api/doctor/patients              - Get doctor's patients
GET /api/doctor/patients/search?q=    - Search patients
GET /api/doctor/patients/:id          - Get patient details with medical history
```

**Required Fields**:
- _id, firstName, lastName, email, phone, lastVisit, nextAppointment, status

---

#### **5. Dashboard Data Endpoints**

```
GET /api/doctor/dashboard/summary      - Get dashboard statistics
GET /api/doctor/dashboard/appointments - Get incoming appointments
GET /api/doctor/dashboard/patients     - Get patient summary
GET /api/doctor/dashboard/activities   - Get activity feed
```

---

## 📊 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Doctor UI Pages                            │
│  (Dashboard, Appointments, Medical Records, Prescriptions)  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Uses Component State (useState)
                     │
┌────────────────────▼────────────────────────────────────────┐
│         API Client (lib/api-client.ts)                      │
│   - Automatic auth token injection                          │
│   - Error handling                                           │
│   - Response transformation                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│      Next.js API Routes (/api/doctor/*)                     │
│   - JWT verification middleware                             │
│   - Request validation                                       │
│   - Business logic                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│           MongoDB Collections                               │
│  - appointments, medicalRecords, prescriptions, patients    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠 Components Need Backend Integration

| Component | Current State | Needs |
|-----------|---------------|-------|
| Dashboard | Mock data (12 items) | Real-time appointment & patient data |
| Appointments List | Mock data (7 items) | Dynamic filtering by date |
| Appointment Status Updates | Not functional | API to update status |
| Medical Records Search | No search logic | Backend search & filter |
| File Upload | Form only | Multipart upload handler |
| Prescriptions List | Mock data (3 items) | Active/inactive filtering |
| Create Prescription | Form only | API to save prescriptions |
| Patient Lookup | No lookup | Patient search endpoint |

---

## 🔐 Authentication & Authorization

**Current Setup**:
- JWT token stored in localStorage (set via `lib/api-client.ts`)
- Authorization header: `Bearer {token}`
- All API calls include auth header automatically

**Doctor-Specific Requirements**:
- Filter data by logged-in doctor's ID
- Only show patients assigned to this doctor
- Only show this doctor's appointments/prescriptions/records

**Backend Should Validate**:
- User is authenticated (JWT valid)
- User role is 'doctor'
- Doctor only sees their own data (not other doctors' records)

---

## 📋 Implementation Checklist

### Phase 1: Data Models & Schemas
- [ ] Appointments MongoDB schema
- [ ] Medical Records MongoDB schema
- [ ] Prescriptions MongoDB schema
- [ ] Ensure doctor_id foreign key on all records

### Phase 2: API CRUD Routes
- [ ] Create appointment endpoints (GET, POST, PUT, DELETE)
- [ ] Create medical records endpoints (GET, POST, PUT, DELETE)
- [ ] Create prescriptions endpoints (GET, POST, PUT, DELETE)
- [ ] Implement search/filter endpoints
- [ ] Add middleware for doctor-only access

### Phase 3: Frontend Integration
- [ ] Replace mock data with API calls
- [ ] Add loading/error states
- [ ] Implement search functionality
- [ ] Add file upload for medical records
- [ ] Real-time status updates

### Phase 4: Advanced Features
- [ ] Pagination for large datasets
- [ ] Export functionality (PDF/CSV)
- [ ] Notification system
- [ ] Activity logging

---

## 🚀 Quick Start for Backend Developer

1. Create API route folder: `app/api/doctor/`
2. Implement following routes:
   - `appointments/route.ts` (GET for list, POST for create)
   - `appointments/[id]/route.ts` (GET single, PUT update, DELETE)
   - `medical-records/route.ts` (GET, POST with file upload)
   - `prescriptions/route.ts` (GET, POST)
3. All routes should:
   - Extract doctor ID from JWT token
   - Filter all queries by doctor ID
   - Validate request data
   - Handle errors gracefully

---

## 💾 MongoDB Schema Recommendations

```javascript
// Appointments
{
  _id: ObjectId,
  doctorId: ObjectId,      // Reference to doctor user
  patientId: ObjectId,     // Reference to patient user
  patientName: String,
  time: String,
  date: Date,
  reason: String,
  notes: String,
  status: String,          // 'scheduled', 'in-progress', 'completed', 'cancelled'
  createdAt: Date,
  updatedAt: Date
}

// Medical Records
{
  _id: ObjectId,
  doctorId: ObjectId,
  patientId: ObjectId,
  patientName: String,
  recordType: String,      // 'Clinical Notes', 'Test Results', etc.
  description: String,
  fileUrl: String,         // S3 or file storage URL
  status: String,          // 'active', 'archived', 'under-review'
  uploadedAt: Date,
  updatedAt: Date
}

// Prescriptions
{
  _id: ObjectId,
  doctorId: ObjectId,
  patientId: ObjectId,
  patientName: String,
  medication: String,
  dosage: String,
  frequency: String,
  duration: String,
  notes: String,
  status: String,          // 'active', 'completed', 'discontinued'
  createdAt: Date,
  updatedAt: Date
}
```

---

## 📱 UI/UX Notes

- All pages follow consistent design pattern
- Uses Tailwind CSS dark mode
- Responsive breakpoints: md (768px)
- Loading state: Animated skeleton (bg-muted animate-pulse)
- Status badges use semantic colors (green=success, red=danger, blue=info)
- Mobile: Fixed sidebar with overlay, hamburger menu
- Desktop: Static sidebar on left, content takes remaining space

---

## 🔧 Configuration Used

From `lib/api-client.ts`:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
```

All API calls use this base URL + endpoint paths.

---

## ✅ Summary of Backend Needs

| Feature | Priority | Effort | Status |
|---------|----------|--------|--------|
| Fetch doctor's appointments | HIGH | 4 hours | ⏳ TODO |
| CRUD appointments | HIGH | 6 hours | ⏳ TODO |
| Fetch medical records | HIGH | 4 hours | ⏳ TODO |
| Upload medical files | HIGH | 8 hours | ⏳ TODO |
| CRUD prescriptions | HIGH | 6 hours | ⏳ TODO |
| Patient search/lookup | MEDIUM | 3 hours | ⏳ TODO |
| Dashboard statistics | MEDIUM | 4 hours | ⏳ TODO |
| Pagination & filtering | MEDIUM | 5 hours | ⏳ TODO |
| Activity audit log | LOW | 3 hours | ⏳ TODO |

**Total Estimated Effort**: 40-45 hours for complete backend implementation

---

## 📞 Questions for Backend Implementation

1. Where to store uploaded medical record files? (S3, local disk, MongoDB?)
2. Should prescriptions be linkable to pharmacy systems?
3. Do we need real-time notifications for new appointments?
4. Should there be field-level access control? (e.g., can receptionists edit prescriptions?)
5. What's the retention policy for deleted/archived records?
6. Do we need audit trails for who accessed what data?
