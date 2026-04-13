import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/auth', '/learn-more', '/', '/api/auth'];

// Routes that require authentication
const protectedRoutes = ['admin', 'doctor', 'patient', 'receptionist'];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const authToken = request.cookies.get('auth_token')?.value;

  // Check if route is public
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    // If on auth page and already logged in, redirect to home
    if (pathname === '/auth' && authToken) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.includes(`/${route}/`));

  if (isProtectedRoute && !authToken) {
    // Redirect to auth page if no token
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
