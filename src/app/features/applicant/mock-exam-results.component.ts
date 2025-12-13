import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExamQuestion, UserAnswer } from '../../core/models/exam.model';

interface MockExamResult {
  examId: number;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  status: 'Passed' | 'Failed';
  timeTaken: string;
  questions: ExamQuestion[];
  userAnswers: UserAnswer[];
}

@Component({
  selector: 'app-mock-exam-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mock-exam-results.component.html',
  styleUrls: ['./mock-exam-results.component.css']
})
export class MockExamResultsComponent implements OnInit {
  private router = inject(Router);

  examResult = signal<MockExamResult | null>(null);
  showAnswerReview = signal<boolean>(false);

  ngOnInit(): void {
    // Get exam result from navigation state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;
    
    if (state && state['examResult']) {
      this.examResult.set(state['examResult']);
    } else {
      // If no result found, redirect to mock exams list
      this.router.navigate(['/applicant/mock-exams']);
    }
  }

  get isPassed(): boolean {
    return this.examResult()?.status === 'Passed';
  }

  get scorePercentage(): number {
    return this.examResult()?.score || 0;
  }

  get statusColor(): string {
    return this.isPassed ? 'success' : 'danger';
  }

  get statusIcon(): string {
    return this.isPassed ? 'bi-check-circle-fill' : 'bi-x-circle-fill';
  }

  get statusMessage(): string {
    return this.isPassed 
      ? 'Excellent! You passed this practice exam.' 
      : 'Keep practicing! You can try another exam to improve.';
  }

  toggleAnswerReview(): void {
    this.showAnswerReview.set(!this.showAnswerReview());
  }

  getUserAnswerForQuestion(question: ExamQuestion): UserAnswer | undefined {
    return this.examResult()?.userAnswers.find(a => a.questionId === question.id);
  }

  isCorrectAnswer(question: ExamQuestion): boolean {
    const userAnswer = this.getUserAnswerForQuestion(question);
    return userAnswer?.selectedAnswerIndex === question.correctAnswerIndex;
  }

  getAnswerLabel(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D, etc.
  }

  goToMockExams(): void {
    this.router.navigate(['/applicant/mock-exams']);
  }

  goToDashboard(): void {
    this.router.navigate(['/applicant/dashboard']);
  }

  takeAnotherExam(): void {
    this.router.navigate(['/applicant/mock-exams']);
  }
}
