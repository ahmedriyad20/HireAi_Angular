import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExamResult, ExamQuestion, UserAnswer } from '../../core/models/exam.model';

@Component({
  selector: 'app-exam-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-results.component.html',
  styleUrls: ['./exam-results.component.css']
})
export class ExamResultsComponent implements OnInit {
  private router = inject(Router);

  examResult = signal<ExamResult | null>(null);
  showAnswerReview = signal<boolean>(false);

  ngOnInit(): void {
    // Get exam result from navigation state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;
    
    if (state && state['examResult']) {
      this.examResult.set(state['examResult']);
    } else {
      // If no result found, redirect to applications
      this.router.navigate(['/applicant/applications']);
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
      ? 'Congratulations! You passed the exam.' 
      : 'Unfortunately, you did not pass the exam.';
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

  goToApplications(): void {
    this.router.navigate(['/applicant/applications']);
  }

  goToDashboard(): void {
    this.router.navigate(['/applicant/dashboard']);
  }

  retakeExam(): void {
    // This could be implemented if retaking is allowed
    alert('Retaking exams is not currently available. Please contact HR for more information.');
  }
}
