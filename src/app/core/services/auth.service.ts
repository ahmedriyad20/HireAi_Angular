import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface ApplicantRegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  address: string;
  phone: string;
  dateOfBirth: string;
  title: string;
  resumeUrl: string;
  skillLevel: string;
}

export interface HRRegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  hrAddress: string;
  phone: string;
  dateOfBirth: string;
  companyName: string;
  companyAddress: string;
  companyDescription: string;
  jobTitle: string;
  accountType: string;
}

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

export interface ValidationError {
  type: string;
  title: string;
  status: number;
  errors: { [key: string]: string[] };
  traceId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5290/api/Account';

  registerApplicant(data: FormData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/RegisterApplicant`, data)
      .pipe(
        tap(response => {
          if (response.isAuthenticated && response.token) {
            this.saveToken(response.token);
            this.saveUserInfo(response);
          }
        }),
        catchError(this.handleError)
      );
  }

  registerHR(data: HRRegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/RegisterHR`, data)
      .pipe(
        tap(response => {
          if (response.isAuthenticated && response.token) {
            this.saveToken(response.token);
            this.saveUserInfo(response);
          }
        }),
        catchError(this.handleError)
      );
  }

  login(email: string, password: string, rememberMe: boolean = false): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/Login`, { email, password })
      .pipe(
        tap(response => {
          if (response.isAuthenticated && response.token && response.refreshToken) {
            this.saveAuthData(response, rememberMe);
          }
        }),
        catchError(this.handleError)
      );
  }

  refreshToken(accessToken: string, refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/RefreshToken`, {
      accessToken,
      refreshToken
    }).pipe(
      tap(response => {
        if (response.isAuthenticated && response.token && response.refreshToken) {
          this.saveAuthData(response);
        }
      }),
      catchError(this.handleError)
    );
  }

  private saveAuthData(response: AuthResponse, rememberMe: boolean = true): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    if (response.token) {
      storage.setItem('accessToken', response.token);
    }
    if (response.refreshToken) {
      storage.setItem('refreshToken', response.refreshToken);
    }
    if (response.identityUserId) {
      storage.setItem('identityUserId', response.identityUserId);
    }
    if (response.userId) {
      storage.setItem('userId', response.userId);
    }
    if (response.userRole) {
      storage.setItem('userRole', response.userRole);
    }
  }

  private saveToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  private saveUserInfo(response: AuthResponse): void {
    if (response.identityUserId) {
      localStorage.setItem('identityUserId', response.identityUserId);
    }
    if (response.userId) {
      localStorage.setItem('userId', response.userId);
    }
    if (response.userRole) {
      localStorage.setItem('userRole', response.userRole);
    }
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
  }

  getUserRole(): string | null {
    return localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
  }

  getUserId(): string | null {
    return localStorage.getItem('userId') || sessionStorage.getItem('userId');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    // Clear from both localStorage and sessionStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('identityUserId');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('identityUserId');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userRole');
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred during registration';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.status === 400 && error.error?.errors) {
      // Validation error from API
      const validationErrors = error.error.errors;
      const errorMessages: string[] = [];
      
      for (const key in validationErrors) {
        if (validationErrors[key] && Array.isArray(validationErrors[key])) {
          errorMessages.push(...validationErrors[key]);
        }
      }
      
      errorMessage = errorMessages.length > 0 
        ? errorMessages.join('. ') 
        : error.error.title || errorMessage;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
