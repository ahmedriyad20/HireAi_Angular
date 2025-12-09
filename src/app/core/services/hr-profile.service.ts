import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HrProfile, UpdateHrProfileRequest } from '../models/hr-profile.model';

@Injectable({
  providedIn: 'root'
})
export class HrProfileService {
  private apiUrl = 'http://localhost:5290/api/HR';

  constructor(private http: HttpClient) {}

  getHrProfile(hrId: number): Observable<HrProfile> {
    return this.http.get<HrProfile>(`${this.apiUrl}/${hrId}`);
  }

  updateHrProfile(hrId: number, updateData: UpdateHrProfileRequest): Observable<HrProfile> {
    return this.http.put<HrProfile>(`${this.apiUrl}/${hrId}`, updateData);
  }
}
