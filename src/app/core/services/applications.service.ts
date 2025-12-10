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
  jobId: number;
  examEvaluationStatus: string;
}

export interface ApplicantDataResponse {
  id: number;
  fullName: string;
  email: string;
  address: string;
  dateOfBirth: string;
  phone: string;
  bio: string;
  title: string;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  resumeUrl: string;
  skillLevel: string;
  applicantSkills: any[];
}

export interface CreateApplicationRequest {
  applicantId: number;
  jobId: number;
  hrId: number;
  cvFilePath: string;
  applicationStatus: string;
}

export interface CreateApplicationResponse {
  id: number;
  applicationStatus: string;
  dateApplied: string;
  cvFilePath: string;
  atsScore: number | null;
  examStatus: string;
  hrId: number;
  applicantId: number;
  jobId: number;
  examId: number | null;
  applicantName: string;
  jobTitle: string;
  hrName: string;
}

export interface AnalyzeApplicationResponse {
  applicationId: number;
  atsScore: number;
  status: string;
  feedback: string;
  skillsFound: string[];
  skillsGaps: string[];
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationsService {
  private apiUrl = 'http://localhost:5290/api/ApplicantDashboard';
  private applicationApiUrl = 'http://localhost:5290/api/Application';
  private applicantApiUrl = 'http://localhost:5290/api/Applicant';

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

  // Get applicant data including resume URL
  getApplicantData(applicantId: number): Observable<ApplicantDataResponse> {
    return this.http.get<ApplicantDataResponse>(`${this.applicantApiUrl}/${applicantId}`);
  }

  // Create a new application
  createApplication(request: CreateApplicationRequest): Observable<CreateApplicationResponse> {
    return this.http.post<CreateApplicationResponse>(this.applicationApiUrl, request);
  }

  // Analyze application CV with AI
  analyzeApplication(applicationId: number): Observable<AnalyzeApplicationResponse> {
    return this.http.get<AnalyzeApplicationResponse>(
      `${this.applicationApiUrl}/analyze/${applicationId}`
    );
  }

  // Check if applicant already applied for a job
  checkExistingApplication(applicantId: number, jobId: number): Observable<boolean> {
    return new Observable(observer => {
      this.getApplicationsList(applicantId).subscribe({
        next: (applications) => {
          const existingApplication = applications.find(app => app.jobId === jobId);
          observer.next(!!existingApplication);
          observer.complete();
        },
        error: (error) => {
          // If error fetching applications, assume no duplicate
          observer.next(false);
          observer.complete();
        }
      });
    });
  }
}
