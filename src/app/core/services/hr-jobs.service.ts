import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JobOpening } from '../models/job.model';

@Injectable({
  providedIn: 'root'
})
export class HRJobsService {
  private apiUrl = 'http://localhost:5290/api/Job';

  constructor(private http: HttpClient) {}

  getHRJobs(hrId: number): Observable<JobOpening[]> {
    return this.http.get<JobOpening[]>(`${this.apiUrl}/hr/${hrId}`);
  }

  getJobById(jobId: number): Observable<JobOpening> {
    return this.http.get<JobOpening>(`${this.apiUrl}/${jobId}`);
  }

  createJob(job: JobOpening): Observable<JobOpening> {
    return this.http.post<JobOpening>(this.apiUrl, job);
  }

  updateJob(jobId: number, job: JobOpening): Observable<JobOpening> {
    return this.http.put<JobOpening>(`${this.apiUrl}?id=${jobId}`, job);
  }

  deleteJob(jobId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${jobId}`);
  }
}
