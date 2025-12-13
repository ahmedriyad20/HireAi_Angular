import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApplicantListItem, ApplicantUpdateRequest, HRListItem, HRUpdateRequest, JobListItem, JobUpdateRequest } from '../models/admin.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = 'http://localhost:5290/api/Admin';

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Get all applicants in the system
   */
  getAllApplicants(): Observable<ApplicantListItem[]> {
    return this.http.get<ApplicantListItem[]>(`${this.baseUrl}/AllApplicants`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error fetching all applicants:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an applicant's information
   * @param applicantId - The ID of the applicant to update
   * @param data - The updated applicant data
   */
  updateApplicant(applicantId: number, data: ApplicantUpdateRequest): Observable<any> {
    return this.http.put(`${this.baseUrl}/ApplicantUpdate/${applicantId}`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error updating applicant:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete an applicant from the system
   * @param applicantId - The ID of the applicant to delete
   */
  deleteApplicant(applicantId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/ApplicantDelete/${applicantId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error deleting applicant:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all HRs in the system
   */
  getAllHRs(): Observable<HRListItem[]> {
    return this.http.get<HRListItem[]>(`${this.baseUrl}/AllHRs`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error fetching all HRs:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an HR's information
   * @param hrId - The ID of the HR to update
   * @param data - The updated HR data
   */
  updateHR(hrId: number, data: HRUpdateRequest): Observable<any> {
    return this.http.put(`${this.baseUrl}/HRUpdate/${hrId}`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error updating HR:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete an HR from the system
   * @param hrId - The ID of the HR to delete
   */
  deleteHR(hrId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/HRDelete/${hrId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error deleting HR:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all job openings in the system
   */
  getAllJobs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetAllJobOpenings`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error fetching all jobs:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update a job opening's information
   * @param jobId - The ID of the job to update
   * @param data - The updated job data
   */
  updateJob(jobId: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/JobOpeningUpdate/${jobId}`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error updating job:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a job opening from the system
   * @param jobId - The ID of the job to delete
   */
  deleteJob(jobId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/JobOpeningDelete/${jobId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error deleting job:', error);
        return throwError(() => error);
      })
    );
  }
}
