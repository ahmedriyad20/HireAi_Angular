import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip adding token for login, register, and refresh token endpoints
  const skipAuth = req.url.includes('/Login') || 
                   req.url.includes('/Register') || 
                   req.url.includes('/RefreshToken');

  // Clone request and add Authorization header if token exists
  let authReq = req;
  if (!skipAuth) {
    const token = authService.getToken();
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors
      if (error.status === 401 && !skipAuth && !isRefreshing) {
        const refreshToken = authService.getRefreshToken();
        const accessToken = authService.getToken();

        if (refreshToken && accessToken) {
          isRefreshing = true;

          // Attempt to refresh the token
          return authService.refreshToken(accessToken, refreshToken).pipe(
            switchMap((response) => {
              isRefreshing = false;

              // Retry the original request with the new token
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.token}`
                }
              });

              return next(retryReq);
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              
              // Refresh token failed, logout and redirect to login
              authService.logout();
              router.navigate(['/auth/login']);
              
              return throwError(() => refreshError);
            })
          );
        } else {
          // No refresh token available, logout and redirect
          authService.logout();
          router.navigate(['/auth/login']);
        }
      }

      return throwError(() => error);
    })
  );
};
