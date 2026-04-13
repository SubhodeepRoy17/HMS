# Quick Reference Guide - Authentication Integration

## 🚀 Start Development

```bash
cd c:\Users\DX1\Desktop\HMS
npm run dev
# App runs at http://localhost:3000
```

---

## 🔗 Key API Endpoints (All have real backend)

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|--------|
| `/api/auth/register` | POST | Create new user account | ❌ No |
| `/api/auth/login` | POST | Authenticate user | ❌ No |
| `/api/auth/verify` | POST | Verify JWT token | ❌ No |
| `/api/auth/me` | GET | Get current user info | ✅ Yes |
| `/api/auth/logout` | POST | Logout user | ✅ Yes |

---

## 🎣 Hook Usage

### Access Auth State
```typescript
import { useAuth } from '@/context/auth-context'

function MyComponent() {
  const { user, isLoading, isAuthenticated } = useAuth()
  
  return <div>{user?.firstName}</div>
}
```

### Check User Role
```typescript
import { useIsAdmin, useIsDoctor } from '@/hooks/use-auth-store'

// Single role check
if (useIsAdmin()) { /* admin only */ }

// Multiple roles
const { useHasRole } = require('@/hooks/use-auth-store')
if (useHasRole(['admin', 'doctor'])) { /* either role */ }
```

### Access Full Auth Context
```typescript
import { useAuth } from '@/context/auth-context'

const authContext = useAuth()
// Available: user, isLoading, isAuthenticated, login, register, logout, verifySession
```

---

## 🛡️ Protected Components

### Protect a Page with ProtectedRoute
```typescript
// app/admin/dashboard/page.tsx
'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'

export default function AdminDashboard() {
  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <div>Admin Panel</div>
    </ProtectedRoute>
  )
}
```

### Conditional Rendering by Role
```typescript
'use client'

import { useIsAdmin } from '@/hooks/use-auth-store'

function Dashboard() {
  const isAdmin = useIsAdmin()
  
  return (
    <div>
      <h1>Dashboard</h1>
      {isAdmin && <AdminPanel />}
    </div>
  )
}
```

---

## 📝 API Client Usage

### Direct API Calls
```typescript
import { authApi } from '@/lib/api-client'

// Login
const result = await authApi.login({
  email: 'user@example.com',
  password: 'SecurePass123'
})
// Token automatically stored in localStorage

// Register
const result = await authApi.register({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '1234567890',
  password: 'SecurePass123',
  role: 'patient'
})

// Get current user
const user = await authApi.getCurrentUser()

// Logout
await authApi.logout()
// Token automatically removed from localStorage
```

---

## 🔐 Context Methods

### Login
```typescript
const { login } = useAuth()

await login('user@example.com', 'SecurePass123')
// Updates state, stores token, redirects to dashboard
```

### Register
```typescript
const { register } = useAuth()

await register({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '1234567890',
  password: 'SecurePass123',
  role: 'doctor',
  department: 'Cardiology',        // optional, for doctors
  specialization: 'Heart Surgery'  // optional, for doctors
})
// Creates account, stores token, redirects to dashboard
```

### Logout
```typescript
const { logout } = useAuth()

await logout()
// Clears token, resets state, redirects to /auth
```

### Verify Session
```typescript
const { verifySession, isLoading } = useAuth()

await verifySession()
// Called automatically on app load
// Check isLoading to know when complete
```

---

## 👤 User Data Structure

### User Object
```typescript
interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: 'admin' | 'doctor' | 'patient' | 'receptionist'
  department?: string      // for doctors
  specialization?: string  // for doctors
  createdAt: string
}
```

### Access User Data
```typescript
const { user } = useAuth()

console.log(user?.firstName)     // "John"
console.log(user?.email)         // "john@example.com"
console.log(user?.role)          // "doctor"
console.log(user?.department)    // "Cardiology"
```

---

## 🧪 Test Credentials

After running registration with:
- Email: `testuser@example.com`
- Password: `SecurePass123`
- Role: `Patient`

Use for login:
```typescript
const { login } = useAuth()
await login('testuser@example.com', 'SecurePass123')
```

---

## 🚨 Error Handling

### In Components
```typescript
const { login } = useAuth()

try {
  await login(email, password)
} catch (error) {
  console.error('Login failed:', error.message)
  // Show error to user
}
```

### Common Error Messages
- `Email already exists` - User with that email registered
- `Invalid email or password` - Wrong credentials
- `Password must be at least 8 characters` - Password too short
- `Password must contain at least one uppercase letter` - No uppercase
- `Password must contain at least one number` - No number
- `Network error` - Backend unreachable

---

## 🔑 Password Requirements

**Must have:**
- ✅ 8+ characters
- ✅ At least 1 UPPERCASE letter
- ✅ At least 1 number (0-9)

**Examples:**
- ✅ `SecurePass123` - Valid
- ✅ `MyPassword99` - Valid
- ❌ `password123` - No uppercase
- ❌ `Password` - No number
- ❌ `Pass1` - Too short

---

## 🗂️ File Locations

**Core Files:**
- API Client: `lib/api-client.ts`
- Auth Context: `context/auth-context.tsx`
- Auth Page: `app/auth/page.tsx`
- Route Protection: `middleware.ts`
- Helper Hooks: `hooks/use-auth-store.ts`

**Components:**
- User Menu: `components/auth/user-menu.tsx`
- Protected Route: `components/auth/protected-route.tsx`
- Header (has UserMenu): `components/layout/header.tsx`

**Documentation:**
- Full Guide: `FRONTEND_BACKEND_INTEGRATION.md`
- This Guide: `INTEGRATION_QUICK_REFERENCE.md`
- Summary: `INTEGRATION_SESSION_SUMMARY.md`

---

## 🔧 Token Management

### Check if Logged In
```typescript
import { getAuthToken } from '@/lib/api-client'

const token = getAuthToken()
if (token) {
  console.log('User is logged in')
}
```

### Manual Token Handling
```typescript
import { getAuthToken, setAuthToken, removeAuthToken } from '@/lib/api-client'

// Get token
const token = getAuthToken()

// Set token (usually done automatically)
setAuthToken('eyJhbGc...')

// Remove token (usually done by logout())
removeAuthToken()
```

---

## 🧵 Make Authenticated Request

```typescript
import { apiRequest } from '@/lib/api-client'

// GET with auth
const data = await apiRequest('/api/some-endpoint', {
  method: 'GET'
})

// POST with auth
const result = await apiRequest('/api/some-endpoint', {
  method: 'POST',
  body: JSON.stringify({ key: 'value' })
})
```

---

## 📋 Common Patterns

### Check Auth Before Rendering
```typescript
function MyComponent() {
  const { user, isLoading } = useAuth()
  
  if (isLoading) return <LoadingSpinner />
  if (!user) return <LoginPrompt />
  
  return <Dashboard />
}
```

### Role-Based Menu Items
```typescript
import { useHasRole } from '@/hooks/use-auth-store'

function Menu() {
  return (
    <nav>
      <a href="/dashboard">Dashboard</a>
      {useHasRole(['admin']) && <a href="/admin">Admin</a>}
      {useHasRole(['doctor']) && <a href="/schedule">My Schedule</a>}
    </nav>
  )
}
```

### Show Different Dashboards
```typescript
import { useAuth } from '@/context/auth-context'

function Dashboard() {
  const { user } = useAuth()
  
  switch(user?.role) {
    case 'admin':
      return <AdminDashboard />
    case 'doctor':
      return <DoctorDashboard />
    case 'patient':
      return <PatientDashboard />
    case 'receptionist':
      return <ReceptionistDashboard />
  }
}
```

### Protect API Calls
```typescript
async function sensitiveOperation() {
  const { user, isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    throw new Error('Not authenticated')
  }
  
  // Make API call
  const result = await apiRequest('/api/protected', {
    method: 'POST',
    body: JSON.stringify({})
  })
}
```

---

## 🐛 Debugging

### Check LocalStorage Token
```javascript
// In browser console
localStorage.getItem('auth_token')
// Should print JWT token if logged in
```

### Check User State
```typescript
// In component
const { user, isAuthenticated, isLoading } = useAuth()
console.log('User:', user)
console.log('Authenticated:', isAuthenticated)
console.log('Loading:', isLoading)
```

### Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Try login/register
4. Check POST requests to `/api/auth/*`
5. Response should have `token` and `user` fields

---

## 📱 Responsive Components

All auth components are mobile-responsive:
- UserMenu: Dropdown adapts to screen size
- Auth Page: Forms stack on mobile
- Protected Route: Works on all screens

---

## ⚡ Performance

- **Token verified once per app load** (not on every page)
- **API calls cached** in React Context
- **No unnecessary re-renders** with proper hooks
- **localStorage used** for persistent storage
- **Middleware runs server-side** (fast route protection)

---

## 🔐 Security Checklist

✅ Passwords hashed with bcryptjs (10 rounds)
✅ JWT tokens expire after 7 days
✅ Authorization headers on all auth requests
✅ Email uniqueness validation
✅ Role-based access control
✅ Server-side middleware protection
✅ Client-side route guards
✅ Token removed on logout
✅ Password requirements enforced

---

## 📞 Support

**Problem**: Login not working
**Solution**: Check MongoDB URI in .env.local, restart dev server

**Problem**: Token not persisting after reload
**Solution**: Check localStorage enabled, verify auth_token key exists

**Problem**: Protected routes show Access Denied
**Solution**: Verify user role matches requiredRoles in ProtectedRoute

**Problem**: UserMenu not showing
**Solution**: Check AuthProvider wraps root layout

---

## 🎯 Routes

| Route | Public | Requires Auth | Description |
|-------|--------|---------------|-------------|
| `/` | ✅ | ❌ | Home page |
| `/auth` | ✅ | ❌ | Login/Register |
| `/admin/dashboard` | ❌ | ✅ Admin | Admin panel |
| `/doctor/dashboard` | ❌ | ✅ Doctor | Doctor panel |
| `/patient/dashboard` | ❌ | ✅ Patient | Patient panel |
| `/receptionist/dashboard` | ❌ | ✅ Receptionist | Receptionist panel |

---

## ✨ Ready to Use!

Everything is integrated and ready to test. Start the dev server and test the authentication flow from registration to logout.

```bash
npm run dev
```

Visit `http://localhost:3000/auth` to begin!
