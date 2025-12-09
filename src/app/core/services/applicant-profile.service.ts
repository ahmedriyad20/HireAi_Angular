import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApplicantProfile, UpdateApplicantProfileRequest } from '../models/applicant-profile.model';

@Injectable({
  providedIn: 'root'
})
export class ApplicantProfileService {
  private apiUrl = 'http://localhost:5290/api/Applicant';

  constructor(private http: HttpClient) {}

  getApplicantProfile(applicantId: number): Observable<ApplicantProfile> {
    const url = `${this.apiUrl}/${applicantId}`;
    console.log('Fetching from URL:', url);
    return this.http.get<any>(url).pipe(
      map(response => ({
        ...response,
        name: response.fullName || response.name || 'Unknown',
        bio: response.bio || '',
        isActive: response.isActive ?? true,
        lastLogin: response.lastLogin || new Date().toISOString(),
        createdAt: response.createdAt || new Date().toISOString(),
        applicantSkills: response.applicantSkills || [],
        address: response.address || '',
        cvId: response.cvId
      }))
    );
  }

  updateApplicantProfile(applicantId: number, updateData: UpdateApplicantProfileRequest): Observable<ApplicantProfile> {
    const url = `${this.apiUrl}/${applicantId}`;
    console.log('Updating profile at URL:', url, 'with data:', updateData);
    return this.http.put<any>(url, updateData).pipe(
      map(response => ({
        ...response,
        name: response.fullName || response.name || 'Unknown',
        bio: response.bio || '',
        isActive: response.isActive ?? true,
        lastLogin: response.lastLogin || new Date().toISOString(),
        createdAt: response.createdAt || new Date().toISOString(),
        applicantSkills: response.applicantSkills || [],
        address: response.address || '',
        cvId: response.cvId
      }))
    );
  }

  updateApplicantProfileWithFile(applicantId: number, formData: FormData): Observable<ApplicantProfile> {
    const url = `${this.apiUrl}/${applicantId}`;
    console.log('Updating profile with file at URL:', url);
    console.log('FormData keys:', Array.from(formData.keys()));
    
    // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
    // Angular HttpClient will automatically handle this for FormData
    return this.http.put<any>(url, formData).pipe(
      map(response => ({
        ...response,
        name: response.fullName || response.name || 'Unknown',
        bio: response.bio || '',
        isActive: response.isActive ?? true,
        lastLogin: response.lastLogin || new Date().toISOString(),
        createdAt: response.createdAt || new Date().toISOString(),
        applicantSkills: response.applicantSkills || [],
        address: response.address || '',
        cvId: response.cvId
      }))
    );
  }
}
