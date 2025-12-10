import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, retry, catchError, throwError } from 'rxjs';
import { 
  ExamResponse, 
  ApplicationDetailResponse, 
  ExamEvaluationRequest,
  ExamEvaluationResponse 
} from '../models/exam.model';

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private apiUrl = 'http://localhost:5290/api';

  constructor(private http: HttpClient) {}

  /**
   * Create exam with AI-generated questions for a specific application
   * @param applicationId The ID of the application
   * @returns Observable of ExamResponse containing questions
   */
  createJobExam(applicationId: number): Observable<ExamResponse> {
    return this.http.post<ExamResponse>(
      `${this.apiUrl}/Exam/JobExamByAI/${applicationId}`,
      {}
    ).pipe(
      catchError(error => {
        console.error('Error creating exam:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get application details including examId
   * @param applicationId The ID of the application
   * @returns Observable of ApplicationDetailResponse
   */
  getApplicationDetails(applicationId: number): Observable<ApplicationDetailResponse> {
    return this.http.get<ApplicationDetailResponse>(
      `${this.apiUrl}/Application/${applicationId}`
    ).pipe(
      catchError(error => {
        console.error('Error fetching application details:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Submit exam evaluation to backend
   * @param evaluation The evaluation request data
   * @returns Observable of ExamEvaluationResponse
   */
  evaluateExam(evaluation: ExamEvaluationRequest): Observable<ExamEvaluationResponse> {
    return this.http.post<ExamEvaluationResponse>(
      `${this.apiUrl}/Exam/evaluate`,
      evaluation
    ).pipe(
      retry(1), // Retry once if fails
      catchError(error => {
        console.error('Error evaluating exam:', error);
        return throwError(() => error);
      })
    );
  }
}
