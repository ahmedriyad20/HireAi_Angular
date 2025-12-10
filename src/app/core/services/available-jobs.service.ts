import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface JobResponse {
  jobId: number;
  title: string;
  companyName: string;
  description: string;
  createdAt: string;
  jobStatus: string;
  examDurationMinutes: number;
  experienceLevel: string;
  employmentType: string;
  location: string;
  salaryRange: string;
  numberOfQuestions: number;
  applicationDeadline: string;
  atsMinimumScore: number;
  hrId: number;
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
  skills: any[];
  createdAt: string;
  updatedAt: string | null;
  totalApplications: number;
  examsCompleted: number;
}

@Injectable({
  providedIn: 'root'
})
export class AvailableJobsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5290/api/AvailableJobs';
  private readonly jobApiUrl = 'http://localhost:5290/api/Job';

  getAvailableJobs(): Observable<JobResponse[]> {
    return this.http.get<JobResponse[]>(this.apiUrl);
  }

  getJobById(jobId: number): Observable<JobDetailsResponse> {
    return this.http.get<JobDetailsResponse>(`${this.jobApiUrl}/${jobId}`);
  }

  getJobIcon(title: string): string {
    const titleLower = title.toLowerCase();
    
    // Check for specific keywords in job title
    if (titleLower.includes('frontend') || titleLower.includes('front-end') || titleLower.includes('ui')) {
      return 'bi-palette';
    }
    if (titleLower.includes('backend') || titleLower.includes('back-end')) {
      return 'bi-server';
    }
    if (titleLower.includes('full stack') || titleLower.includes('fullstack')) {
      return 'bi-layers';
    }
    if (titleLower.includes('devops') || titleLower.includes('sre')) {
      return 'bi-diagram-3';
    }
    if (titleLower.includes('data') || titleLower.includes('analyst') || titleLower.includes('scientist')) {
      return 'bi-graph-up';
    }
    if (titleLower.includes('mobile') || titleLower.includes('ios') || titleLower.includes('android')) {
      return 'bi-phone';
    }
    if (titleLower.includes('designer') || titleLower.includes('ux') || titleLower.includes('design')) {
      return 'bi-pencil-square';
    }
    if (titleLower.includes('qa') || titleLower.includes('test') || titleLower.includes('quality')) {
      return 'bi-check-circle';
    }
    if (titleLower.includes('security') || titleLower.includes('cybersecurity')) {
      return 'bi-shield-lock';
    }
    if (titleLower.includes('manager') || titleLower.includes('lead') || titleLower.includes('director')) {
      return 'bi-people';
    }
    if (titleLower.includes('engineer') || titleLower.includes('developer') || titleLower.includes('programmer')) {
      return 'bi-code-slash';
    }
    
    // Default icon
    return 'bi-briefcase';
  }
}
