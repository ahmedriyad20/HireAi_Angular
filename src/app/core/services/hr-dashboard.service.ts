import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HRDashboardData } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class HRDashboardService {
  private apiUrl = 'http://localhost:5290/api/HRDashboard';

  constructor(private http: HttpClient) {}

  getDashboardData(hrId: number): Observable<HRDashboardData> {
    return this.http.get<HRDashboardData>(`${this.apiUrl}/${hrId}`);
  }
}
