import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface AuthResponse {
  isAuthenticated: boolean;
  token: string | null;
  expiresOn: string | null;
  refreshToken: string | null;
  message: string;
  identityUserId: string | null;
  userId: string | null;
  userRole: string | null;
  errors: string[];
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ChangeEmailRequest {
  newEmail: string;
  confirmNewEmail: string;
}

export interface DeleteAccountRequest {
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountSettingsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5290/api/Account';

  changePassword(request: ChangePasswordRequest): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.apiUrl}/change-password`, request)
      .pipe(catchError(this.handleError));
  }

  changeEmail(request: ChangeEmailRequest): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.apiUrl}/change-email`, request)
      .pipe(catchError(this.handleError));
  }

  deleteAccount(request: DeleteAccountRequest): Observable<AuthResponse> {
    return this.http.delete<AuthResponse>(`${this.apiUrl}/delete-account`, {
      body: request
    })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Account Settings API Error:', error);
    let errorMessage = 'An error occurred. Please try again.';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else if (error.status === 400) {
      // Validation errors from API - check multiple formats
      if (error.error?.errors) {
        if (Array.isArray(error.error.errors)) {
          errorMessage = error.error.errors.join(', ');
        } else if (typeof error.error.errors === 'object') {
          const errors = Object.values(error.error.errors).flat();
          errorMessage = errors.join(', ');
        }
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      }
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 401) {
      errorMessage = 'Invalid password. Please try again.';
    } else if (error.status === 403) {
      errorMessage = 'You do not have permission to perform this action.';
    } else if (error.status === 500) {
      errorMessage = 'Server error. Please try again later.';
    }

    console.error('Error message extracted:', errorMessage);
    return throwError(() => errorMessage);
  }
}
