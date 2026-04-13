# Hospital Management System - Authentication API Documentation

## Overview

This document provides comprehensive documentation for the HMS authentication API. The API uses JWT (JSON Web Tokens) for secure authentication and MongoDB for data persistence.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All protected endpoints require an `Authorization` header with a Bearer token:

```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### 1. User Registration

**Endpoint:** `POST /auth/register`

**Description:** Create a new user account

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "phone": "+1-234-567-8900",
  "role": "patient",
  "department": "Cardiology",
  "specialization": "Cardiac Surgery"
}
```

**Request Fields:**
- `firstName` (string, required): User's first name
- `lastName` (string, required): User's last name
- `email` (string, required): User's email address (must be unique)
- `password` (string, required): Password (8+ chars, uppercase, number)
- `confirmPassword` (string, required): Password confirmation (must match)
- `phone` (string, required): Phone number (10+ digits)
- `role` (string, required): One of `admin`, `doctor`, `patient`, `receptionist`
- `department` (string, optional): Department name (for doctors)
- `specialization` (string, optional): Job specialization (for doctors)

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "609c31e8f7c4a50001234567",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1-234-567-8900",
    "role": "patient",
    "department": "Cardiology",
    "specialization": "Cardiac Surgery",
    "isActive": false,
    "isEmailVerified": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation error (missing fields, invalid format, etc.)
- `409 Conflict`: Email already registered

---

### 2. User Login

**Endpoint:** `POST /auth/login`

**Description:** Authenticate user and receive JWT token

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Request Fields:**
- `email` (string, required): User's email address
- `password` (string, required): User's password

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "609c31e8f7c4a50001234567",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1-234-567-8900",
    "role": "patient",
    "isActive": true,
    "isEmailVerified": false,
    "lastLogin": "2024-01-15T11:45:00Z",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:45:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account is inactive

---

### 3. Verify Token

**Endpoint:** `GET /auth/verify`

**Description:** Verify JWT token validity without database lookup

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token is valid",
  "user": {
    "_id": "609c31e8f7c4a50001234567",
    "email": "john@example.com",
    "role": "patient"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token

---

### 4. Get Current User

**Endpoint:** `GET /auth/me`

**Description:** Get authenticated user's profile information

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "user": {
    "_id": "609c31e8f7c4a50001234567",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1-234-567-8900",
    "role": "patient",
    "isActive": true,
    "isEmailVerified": false,
    "lastLogin": "2024-01-15T11:45:00Z",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:45:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: User not found in database

---

### 5. Logout

**Endpoint:** `POST /auth/logout`

**Description:** Logout user (primarily client-side operation)

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Password Requirements

- **Minimum Length:** 8 characters
- **Uppercase Letter:** At least one (A-Z)
- **Numeric Character:** At least one (0-9)
- **Example:** `SecurePass123` ✓

---

## User Roles

| Role | Description | Auto-Active |
|------|-------------|-------------|
| `admin` | System administrator | Yes |
| `doctor` | Medical doctor | No |
| `patient` | Patient account | No |
| `receptionist` | Reception staff | No |

**Auto-Active:** Admin accounts are automatically activated upon registration. Other roles require approval from an admin.

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `MISSING_FIRST_NAME` | 400 | First name is required |
| `MISSING_LAST_NAME` | 400 | Last name is required |
| `MISSING_EMAIL` | 400 | Email is required |
| `MISSING_PASSWORD` | 400 | Password is required |
| `MISSING_PHONE` | 400 | Phone number is required |
| `MISSING_ROLE` | 400 | Role is required |
| `PASSWORD_MISMATCH` | 400 | Passwords do not match |
| `INVALID_EMAIL` | 400 | Invalid email format |
| `INVALID_PHONE` | 400 | Invalid phone format |
| `INVALID_ROLE` | 400 | Invalid role provided |
| `WEAK_PASSWORD` | 400 | Password does not meet requirements |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `INVALID_CREDENTIALS` | 401 | Email or password is incorrect |
| `ACCOUNT_INACTIVE` | 403 | Account is inactive |
| `NO_TOKEN` | 401 | Authentication token is missing |
| `INVALID_TOKEN` | 401 | Token is invalid or expired |
| `USER_NOT_FOUND` | 404 | User not found in database |
| `SERVER_ERROR` | 500 | Internal server error |

---

## Environment Configuration

Create a `.env.local` file in the project root:

```env
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0
MONGO_DB_NAME=hospital_management_system

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production_at_least_32_chars_long
JWT_EXPIRES_IN=7d

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NODE_ENV=development
```

**Important:** Replace `<db_password>` in MONGODB_URI with your actual MongoDB Atlas password.

---

## Testing with cURL

### Register New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123",
    "phone": "+1-234-567-8900",
    "role": "patient"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### Verify Token
```bash
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### Get Current User
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (bcrypt hashed),
  phone: String,
  role: String (enum: admin, doctor, patient, receptionist),
  department: String (optional),
  specialization: String (optional),
  isActive: Boolean,
  isEmailVerified: Boolean,
  lastLogin: Date (optional),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Security Features

1. **Password Hashing:** Passwords are hashed using bcryptjs with 10 salt rounds
2. **JWT Tokens:** Signed with a secret key and expire after 7 days
3. **Email Validation:** Only valid email formats are accepted
4. **Password Strength:** Enforced with complexity requirements
5. **Account Activation:** Role-based auto-activation (admin only)
6. **Generic Error Messages:** Login errors don't reveal if email exists
7. **Connection Pooling:** MongoDB connection pooling (2-10 connections)

---

## Next Steps

1. **Update MongoDB URI:** Replace `<db_password>` in `.env.local` with your actual password
2. **Test Endpoints:** Use the cURL examples above to test all endpoints
3. **Frontend Integration:** Create login/register forms in React components
4. **Protected Routes:** Implement route protection middleware
5. **Email Verification:** Add email verification flow
6. **Password Reset:** Implement forgot password functionality
7. **Admin Dashboard:** Create user management endpoints

---

## Support

For issues or questions, refer to:
- MongoDB Documentation: https://docs.mongodb.com
- JWT Documentation: https://jwt.io
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
