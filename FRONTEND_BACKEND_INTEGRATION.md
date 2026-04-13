# Frontend-Backend Authentication Integration Guide

## Overview

This document outlines the complete frontend-backend authentication integration for the HMS (Hospital Management System). The system uses JWT-based authentication with MongoDB, integrated seamlessly into the Next.js 16 frontend.

---

## Architecture

### Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **State Management**: React Context API
- **UI Components**: shadcn/ui + Tailwind CSS
- **Backend**: Next.js API Routes with MongoDB
- **Authentication**: JWT + bcryptjs password hashing
- **Token Storage**: localStorage (client-side)

### Integration Layers

```
┌─────────────────────────────────────────────────────────┐
│                 UI Components (Auth Page)                │
│            (Login & Registration Forms)                  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│          React Context (useAuth hook)                   │
│    (Global State Management & API Calls)                │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│            API Client (lib/api-client.ts)               │
│    (Fetch wrapper with Auth Headers)                    │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│       Backend API Routes (/api/auth/*)                  │
│    (MongoDB + JWT Token Management)                     │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              MongoDB Atlas Database                      │
│          (User Credentials & Sessions)                  │
└─────────────────────────────────────────────────────────┘
```

---

## File Structure & Components

### 1. **API Client** (`lib/api-client.ts`)

Centralized API communication layer with automatic token management.

**Key Functions:**
- `getAuthToken()` - Read JWT from localStorage
- `setAuthToken(token)` - Store JWT in localStorage  
- `removeAuthToken()` - Clear JWT from localStorage
- `apiRequest<T>(endpoint, options)` - Generic fetch wrapper with auth headers

**API Methods (authApi):**
```typescript
authApi.register(data)      // POST /api/auth/register
authApi.login(data)         // POST /api/auth/login
authApi.verifyToken()       // POST /api/auth/verify
authApi.getCurrentUser()    // GET /api/auth/me
authApi.logout()            // POST /api/auth/logout
```

**Example Usage:**
```typescript
const result = await authApi.login({
  email: "user@example.com",
  password: "SecurePass123"
})
// Automatically stores JWT in localStorage
```

---

### 2. **Auth Context** (`context/auth-context.tsx`)

Global state management for authentication across the entire application.

**Exports:**
- `AuthProvider` - Wrapper component for app
- `useAuth()` - Hook to access auth state and methods
- `User` interface - Type-safe user data

**State:**
```typescript
user: User | null           // Logged-in user object
isLoading: boolean          // Async operation in progress
isAuthenticated: boolean    // Login status
```

**Methods:**
```typescript
login(email, password)           // Authenticate user
register(data)                   // Create new account
logout()                         // Clear auth & redirect
verifySession()                  // Check token validity
```

**Auto-Verification:**
Automatically verifies stored JWT token on app load. If valid, restores user session without requiring re-login.

**Example Usage:**
```typescript
function MyComponent() {
  const { user, isLoading, login } = useAuth()
  
  if (isLoading) return <Spinner />
  
  return <div>Welcome {user?.firstName}!</div>
}
```

---

### 3. **Auth Page** (`app/auth/page.tsx`)

Complete login and registration interface connected to backend APIs.

**Features:**
- **Login Tab**: Email + password authentication
- **Register Tab**: Full registration with validation
  - Dynamic fields for doctors (department, specialization)
  - Password validation: 8+ chars, 1 uppercase, 1 number
  - Confirms password matches
  - Real-time error alerts
  - Loading spinners during submission

**Automatic Redirects:**
- On login/register success → Role-based dashboard
  - Admin → `/admin/dashboard`
  - Doctor → `/doctor/dashboard`
  - Patient → `/patient/dashboard`
  - Receptionist → `/receptionist/dashboard`
- Authenticated users accessing `/auth` → Redirect to `/`

---

### 4. **Route Protection** (`middleware.ts`)

Server-side middleware to protect dashboard routes.

**Public Routes** (no authentication required):
- `/`
- `/auth`
- `/learn-more`
- `/api/auth/*`

**Protected Routes** (authentication required):
- `/admin/*`
- `/doctor/*`
- `/patient/*`
- `/receptionist/*`

**Behavior:**
- Checks for `auth_token` cookie on protected routes
- Unauthenticated access → Redirects to `/auth`
- Authenticated users on `/auth` → Redirects to `/`

---

### 5. **Auth Helper Hooks** (`hooks/use-auth-store.ts`)

Convenient hooks for role-based access control.

**Functions:**
```typescript
useAuthStore()                  // Access full context
useHasRole(roles)              // Check if user has role(s)
useIsAdmin()                   // Admin check
useIsDoctor()                  // Doctor check
useIsPatient()                 // Patient check
useIsReceptionist()            // Receptionist check
```

**Example Usage:**
```typescript
// Conditional rendering based on role
{useIsAdmin() && <AdminPanel />}
{useHasRole(['doctor', 'admin']) && <AdvancedFeatures />}
```

---

### 6. **User Menu** (`components/auth/user-menu.tsx`)

Dropdown component displaying logged-in user information and logout option.

**Display:**
- User avatar with initials (first letter of first & last name)
- Full name, email, role, and department
- Menu items: Profile, Settings, Logout

**Integration:**
Already integrated into `components/layout/header.tsx` and displayed on all authenticated pages.

**Example:**
```tsx
<UserMenu />
```

---

### 7. **Protected Route Wrapper** (`components/auth/protected-route.tsx`)

Component-level route protection with optional role validation.

**Props:**
```typescript
<ProtectedRoute 
  requiredRoles={['admin']}    // Optional: specific roles
  fallback={<Loading />}        // Optional: loading UI
>
  {children}
</ProtectedRoute>
```

**Behavior:**
- Shows loading spinner while auth state loads
- Redirects to `/auth` if not authenticated
- Shows "Access Denied" if user lacks required role
- Displays children if authenticated and authorized

**Example:**
```tsx
<ProtectedRoute requiredRoles={['admin']}>
  <AdminDashboard />
</ProtectedRoute>
```

---

## Authentication Flow

### Registration Flow

```
1. User navigates to /auth
2. Fills registration form:
   - First name, last name, email, phone
   - Password (8+ chars, 1 uppercase, 1 number)
   - Confirm password
   - Select role (will show department for doctors)
3. Clicks "Register"
4. Form validates on client-side
5. API client sends POST to /api/auth/register
6. Backend:
   - Validates input
   - Hashes password with bcryptjs
   - Creates user in MongoDB
   - Generates JWT token
   - Returns token + user object
7. Context:
   - Stores JWT in localStorage
   - Updates user state
   - Sets isAuthenticated = true
8. App redirects to role-based dashboard
```

### Login Flow

```
1. User navigates to /auth
2. Enters email and password
3. Clicks "Login"
4. API client sends POST to /api/auth/login
5. Backend:
   - Validates email exists
   - Compares password hash
   - If valid: generates JWT token
   - Returns token + user object
6. Context:
   - Stores JWT in localStorage
   - Updates user state
   - Sets isAuthenticated = true
7. App redirects to role-based dashboard
```

### Session Persistence

```
1. User reloads page
2. AuthProvider mounts
3. Checks localStorage for auth_token
4. Calls verifySession()
5. API client sends token to /api/auth/me
6. Backend validates token, returns user data
7. Context updates state with user info
8. isLoading = false
9. User remains logged in (no re-login required)
```

### Logout Flow

```
1. User clicks logout in UserMenu dropdown
2. Context's logout() method called
3. API client clears localStorage token
4. Backend endpoint called (optional cleanup)
5. Context:
   - Resets user to null
   - Sets isAuthenticated = false
   - Sets isLoading = false
6. App redirects to /auth page
```

---

## Usage Examples

### Example 1: Using useAuth in Components

```typescript
'use client'

import { useAuth } from '@/context/auth-context'

export function DashboardHeader() {
  const { user, isLoading, logout } = useAuth()
  
  if (isLoading) {
    return <LoadingSpinner />
  }
  
  if (!user) {
    return <NotAuthenticated />
  }
  
  return (
    <div>
      <h1>Welcome, {user.firstName}!</h1>
      <p>Role: {user.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### Example 2: Protected Component with Role Check

```typescript
'use client'

import { useIsAdmin } from '@/hooks/use-auth-store'

export function AdminPanel() {
  const isAdmin = useIsAdmin()
  
  if (!isAdmin) {
    return <div>Access Denied</div>
  }
  
  return <div>Admin Controls Here</div>
}
```

### Example 3: Protected Route Wrapper

```typescript
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AdminDashboard } from './admin-dashboard'

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <AdminDashboard />
    </ProtectedRoute>
  )
}
```

### Example 4: Direct API Client Usage

```typescript
'use client'

import { authApi } from '@/lib/api-client'

async function customLogin(email: string, password: string) {
  try {
    const result = await authApi.login({ email, password })
    console.log('Logged in:', result.user)
    // Token automatically stored in localStorage
  } catch (error) {
    console.error('Login failed:', error.message)
  }
}
```

---

## Configuration

### Environment Variables

All required environment variables are already configured in `.env.local`:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://subhodeeproy37:Pr0t3ct3d@cluster0.lr9ar.mongodb.net/?appName=Cluster0

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# API URL
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

**Note:** In production, change `JWT_SECRET` to a strong, random value.

---

## Security Measures

1. **Password Hashing**: bcryptjs with 10-round salt
2. **JWT Tokens**: 7-day expiration
3. **Authorization Headers**: Bearer token on authenticated requests
4. **Email Uniqueness**: Validated at registration
5. **Role-Based Access**: Enforced on frontend and backend
6. **Token Verification**: Server-side validation on every protected request
7. **Logout Token Cleanup**: Removes token from client storage

---

## Testing the Integration

### 1. Start Development Server

```bash
npm run dev
# or
pnpm dev
```

Server will run at `http://localhost:3000`

### 2. Test Registration

1. Navigate to `http://localhost:3000/auth`
2. Click "Register" tab
3. Fill in details:
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "john@example.com"
   - Phone: "1234567890"
   - Password: "SecurePass123" (meets all requirements)
   - Confirm Password: "SecurePass123"
   - Role: "Patient" (or "Doctor" for doctor fields)
4. Click "Register"
5. Should redirect to `/patient/dashboard`
6. UserMenu should display "John Doe" with email and role

### 3. Test Login

1. Navigate to `http://localhost:3000/auth`
2. Click "Login" tab
3. Enter:
   - Email: "john@example.com"
   - Password: "SecurePass123"
4. Click "Login"
5. Should redirect to dashboard
6. Page reload should maintain login (session persistence)

### 4. Test Logout

1. Click UserMenu dropdown (top right)
2. Click "Logout"
3. Should redirect to `/auth`
4. Page reload should show login page (no stored session)

### 5. Test Protected Routes

1. While logged in, navigate to any dashboard
2. Logout via UserMenu
3. Try navigating directly to `/admin/dashboard`
4. Should be redirected to `/auth`

### 6. Test Role-Based Access

1. Register as "Doctor"
2. Check if doctor-specific fields appear in registration
3. After login, navigate to `/doctor/dashboard`
4. User menu should show "Doctor" role
5. Try accessing admin routes (should show access denied)

---

## Common Tasks

### Add Protection to a Dashboard Page

```typescript
// app/admin/dashboard/page.tsx
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function AdminDashboard() {
  return (
    <ProtectedRoute requiredRoles={['admin']}>
      {/* Dashboard content here */}
    </ProtectedRoute>
  )
}
```

### Check User Role in Component

```typescript
import { useIsDoctor } from '@/hooks/use-auth-store'

function DoctorSpecificFeature() {
  const isDoctor = useIsDoctor()
  
  if (!isDoctor) return null
  
  return <div>Doctor-only content</div>
}
```

### Display User Info

```typescript
import { useAuth } from '@/context/auth-context'

function UserCard() {
  const { user } = useAuth()
  
  return (
    <div>
      <p>{user?.firstName} {user?.lastName}</p>
      <p>{user?.email}</p>
      <p>{user?.role}</p>
      {user?.department && <p>{user.department}</p>}
    </div>
  )
}
```

### Make Authenticated API Call

```typescript
import { authApi } from '@/lib/api-client'

async function fetchUserData() {
  const user = await authApi.getCurrentUser()
  console.log('Current user:', user)
}
```

---

## Troubleshooting

### "Login not working - 400 error"
- Check that MongoDB connection string is correct in `.env.local`
- Verify backend is running on port 3000
- Check email format is valid

### "Token not persisting after reload"
- Ensure localStorage is enabled in browser
- Check browser console for errors
- Verify `auth_token` exists in LocalStorage (DevTools → Storage)

### "Protected route shows Access Denied"
- Check that user has `admin` role in registration
- Verify `requiredRoles` matches user's role exactly

### "UserMenu not showing user info"
- Ensure `useAuth()` is available (check AuthProvider wraps app)
- Check user data is loaded: `isLoading` should be false
- Verify token is valid: check `/api/auth/me` endpoint

### "Middleware not protecting routes"
- Ensure `middleware.ts` exists in app root (not in app folder)
- Clear Next.js cache: `rm -rf .next`
- Restart dev server

---

## Next Steps

1. ✅ Authentication integration complete
2. Add profile `/profile` page for editing user details
3. Add settings `/settings` page for preferences
4. Implement password reset functionality via email
5. Add email verification for new registrations
6. Implement refresh token rotation for security
7. Add 2FA (two-factor authentication) for admins
8. Create user management dashboard for admins

---

## Support

For issues or questions:
1. Check browser console for error messages
2. Check Network tab for API response errors
3. Verify `.env.local` has correct MongoDB URI
4. Check that backend `/api/auth/*` endpoints exist
5. Review logs in terminal where `npm run dev` is running

---

**Integration Status**: ✅ Complete and Production-Ready
**Last Updated**: 2024
