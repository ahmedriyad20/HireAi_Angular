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
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationsService {
  private apiUrl = 'http://localhost:5290/api/Applicant/ApplicationsList';

  constructor(private http: HttpClient) {}

  getApplicationsList(applicantId: number): Observable<ApplicationResponse[]> {
    return this.http.get<ApplicationResponse[]>(`${this.apiUrl}/${applicantId}`);
  }
}
