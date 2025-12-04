import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApplicantProfile } from '../models/applicant-profile.model';

@Injectable({
  providedIn: 'root'
})
export class ApplicantProfileService {
  private apiUrl = 'http://localhost:5290/api/Applicant';

  constructor(private http: HttpClient) {}

  getApplicantProfile(applicantId: number): Observable<ApplicantProfile> {
    const url = `${this.apiUrl}/${applicantId}`;
    console.log('Fetching from URL:', url);
    return this.http.get<ApplicantProfile>(url);
  }
}
