import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApplicantDashboardData } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class ApplicantDashboardService {
  private apiUrl = 'http://localhost:5290/api/Applicant/Dashboard';

  constructor(private http: HttpClient) {}

  getDashboardData(applicantId: number): Observable<ApplicantDashboardData> {
    return this.http.get<ApplicantDashboardData>(`${this.apiUrl}/${applicantId}`);
  }
}
