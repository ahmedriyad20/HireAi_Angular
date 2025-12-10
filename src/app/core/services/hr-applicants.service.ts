import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HrJobsListResponse, JobApplicationsResponse } from '../models/hr-applicants.model';

@Injectable({
  providedIn: 'root'
})
export class HrApplicantsService {
  private apiUrl = 'http://localhost:5290/api/JobDetails';

  constructor(private http: HttpClient) {}

  /**
   * Get all jobs posted by a specific HR
   * @param hrId - The ID of the HR user
   * @returns Observable of HrJobsListResponse containing all jobs
   */
  getHrJobs(hrId: number): Observable<HrJobsListResponse> {
    return this.http.get<HrJobsListResponse>(`${this.apiUrl}/AllJobs/${hrId}`);
  }

  /**
   * Get detailed applications for a specific job
   * @param jobId - The ID of the job
   * @param hrId - The ID of the HR user
   * @returns Observable of JobApplicationsResponse containing job details and applications
   */
  getJobApplications(jobId: number, hrId: number): Observable<JobApplicationsResponse> {
    return this.http.get<JobApplicationsResponse>(`${this.apiUrl}/${jobId},${hrId}`);
  }
}
