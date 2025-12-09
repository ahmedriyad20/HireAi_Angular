import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApplicationResponse {
  applicationId: number;
  jobTitle: string;
  companyName: string;
  companyLocation: string;
  appliedAt: string;
  atsScore: number;
  applicationStatus: string;
  jobType: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationsService {
  private apiUrl = 'http://localhost:5290/api/ApplicantDashboard';
  private applicationApiUrl = 'http://localhost:5290/api/Application';

  constructor(private http: HttpClient) {}

  getApplicationsList(applicantId: number): Observable<ApplicationResponse[]> {
    return this.http.get<ApplicationResponse[]>(`${this.apiUrl}/${applicantId}/Applications`);
  }

  getApplicationById(applicationId: number): Observable<any> {
    return this.http.get<any>(`${this.applicationApiUrl}/${applicationId}`);
  }

  deleteApplication(applicationId: number): Observable<void> {
    return this.http.delete<void>(`${this.applicationApiUrl}/${applicationId}`);
  }
}
