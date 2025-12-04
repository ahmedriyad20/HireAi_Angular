import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MockExamQuickStats {
  mockExamsTakenNumber: number;
  mockExamsTakenNumberForCurrentMonth: number;
  averageExamsTakenScore: number;
  averageExamsTakenScoreImprovement: number;
}

export interface MockExam {
  examName: string;
  examDescription: string;
  examLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  numberOfQuestions: number;
  durationInMinutes: number;
}

@Injectable({
  providedIn: 'root'
})
export class MockExamsService {
  private baseUrl = 'http://localhost:5290/api/Exam';

  constructor(private http: HttpClient) {}

  getQuickStats(applicantId: string): Observable<MockExamQuickStats> {
    return this.http.get<MockExamQuickStats>(`${this.baseUrl}/QuickStats/${applicantId}`);
  }

  getRecommendedMockExams(applicantId: string): Observable<MockExam[]> {
    const url = `${this.baseUrl}/RecommendedMockExams/${applicantId}`;
    console.log('Fetching recommended exams from:', url);
    return this.http.get<MockExam[]>(url);
  }

  getAllMockExams(applicantId: string): Observable<MockExam[]> {
    const url = `${this.baseUrl}/AllMockExams/${applicantId}`;
    console.log('Fetching all exams from:', url);
    return this.http.get<MockExam[]>(url);
  }
}
