import { useAuth } from '@/context/auth-context';

/**
 * Custom hook to use authentication
 * - Provides user, isLoading, isAuthenticated state
 * - Provides login, register, logout, verifySession methods
 */
export function useAuthStore() {
  const auth = useAuth();
  return auth;
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(roles: string | string[]) {
  const { user } = useAuth();
  const rolesArray = Array.isArray(roles) ? roles : [roles];
  return user ? rolesArray.includes(user.role) : false;
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin() {
  return useHasRole('admin');
}

/**
 * Hook to check if user is doctor
 */
export function useIsDoctor() {
  return useHasRole('doctor');
}

/**
 * Hook to check if user is patient
 */
export function useIsPatient() {
  return useHasRole('patient');
}

/**
 * Hook to check if user is receptionist
 */
export function useIsReceptionist() {
  return useHasRole('receptionist');
}
