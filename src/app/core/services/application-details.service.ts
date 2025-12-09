import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApplicationDetails } from '../models/application-details.model';

@Injectable({
  providedIn: 'root'
})
export class ApplicationDetailsService {
  private apiUrl = 'http://localhost:5290/api/ApplicantDashboard';

  constructor(private http: HttpClient) {}

  getApplicationDetails(applicationId: number, applicantId: number): Observable<ApplicationDetails> {
    return this.http.get<ApplicationDetails>(`${this.apiUrl}/${applicantId}/Applications/${applicationId}`);
  }
}
