import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface JobSkill {
  id: number;
  title: string;
  description: string;
}

export interface JobDetailsResponse {
  id: number;
  title: string;
  companyName: string;
  description: string;
  jobStatus: string;
  examDurationMinutes: number;
  experienceLevel: string;
  employmentType: string;
  location: string;
  salaryRange: string;
  numberOfQuestions: number;
  applicationDeadline: string;
  atsMinimumScore: number;
  autoSend: boolean;
  hrId: number;
  skills: JobSkill[];
  createdAt: string;
  updatedAt: string | null;
  totalApplications: number;
  examsCompleted: number;
}

export interface ApplicationsCountResponse {
  jobId: number;
  totalApplications: number;
}

@Injectable({
  providedIn: 'root'
})
export class JobDetailsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5290/api/Job';

  getJobDetails(jobId: number): Observable<JobDetailsResponse> {
    return this.http.get<JobDetailsResponse>(`${this.apiUrl}/${jobId}`);
  }

  getApplicationsCount(jobId: number): Observable<ApplicationsCountResponse> {
    return this.http.get<ApplicationsCountResponse>(`${this.apiUrl}/${jobId}/applications-count`);
  }
}
