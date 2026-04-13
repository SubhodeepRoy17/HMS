import { NextRequest } from 'next/server'
import { verifyToken } from './auth'
import { JWTPayload } from './types'

export interface AuthUser extends JWTPayload {
  userId: string
  email: string
  role: 'admin' | 'doctor' | 'patient' | 'receptionist'
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  return parts[1]
}

/**
 * Verify JWT token and return user data
 */
export function verifyAuth(req: NextRequest): AuthUser | null {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return null
    }

    // Verify and decode token
    const verified = verifyToken(token)
    
    if (!verified) {
      return null
    }

    return verified as AuthUser
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}
