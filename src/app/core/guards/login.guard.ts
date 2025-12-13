import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Login Guard
 * Prevents authenticated users from accessing login/register pages
 * Redirects logged-in users to their appropriate dashboard
 */
export const loginGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // Check if user is already authenticated
  if (authService.isAuthenticated()) {
    // Get user role to redirect to appropriate dashboard
    const userRole = authService.getUserRole();
    
    if (userRole === 'HR') {
      router.navigate(['/hr/dashboard']);
    } else if (userRole === 'Applicant') {
      router.navigate(['/applicant/dashboard']);
    } else if (userRole === 'Admin' || userRole === 'Administrator') {
      router.navigate(['/admin/applicants']);
    } else {
      // Fallback to generic dashboard if role is unclear
      router.navigate(['/dashboard']);
    }
    
    return false; // Prevent access to login page
  }

  // User is not logged in, allow access to login page
  return true;
};
