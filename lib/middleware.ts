import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from './auth';
import { JWTPayload, UserRole } from './types';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: AuthenticatedRequest) => {
    try {
      const token = extractTokenFromHeader(req.headers.get('authorization'));
      
      if (!token) {
        return errorResponse('Authentication token missing', 401, 'NO_TOKEN');
      }

      const payload = verifyToken(token);
      
      if (!payload) {
        return errorResponse('Invalid or expired token', 401, 'INVALID_TOKEN');
      }

      req.user = payload;
      return await handler(req);
    } catch (error) {
      console.error('Authentication error:', error);
      return errorResponse('Internal server error', 500, 'AUTH_ERROR');
    }
  };
}

/**
 * Middleware to require specific roles
 */
export function requireRole(...roles: UserRole[]) {
  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
    return async (req: AuthenticatedRequest) => {
      try {
        const token = extractTokenFromHeader(req.headers.get('authorization'));
        
        if (!token) {
          return errorResponse('Authentication token missing', 401, 'NO_TOKEN');
        }

        const payload = verifyToken(token);
        
        if (!payload) {
          return errorResponse('Invalid or expired token', 401, 'INVALID_TOKEN');
        }

        if (!roles.includes(payload.role)) {
          return errorResponse(
            `Required role: ${roles.join(', ')}`,
            403,
            'INSUFFICIENT_PERMISSION'
          );
        }

        req.user = payload;
        return await handler(req);
      } catch (error) {
        console.error('Authorization error:', error);
        return errorResponse('Internal server error', 500, 'AUTH_ERROR');
      }
    };
  };
}

/**
 * Standardized error response
 */
export function errorResponse(
  message: string,
  status: number = 400,
  code: string = 'ERROR'
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      message,
      code,
    },
    { status }
  );
}

/**
 * Standardized success response
 */
export function successResponse(data: unknown, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}
