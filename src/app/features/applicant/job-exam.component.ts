import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService } from '../../core/services/exam.service';
import { 
  ExamQuestion, 
  ExamResponse, 
  UserAnswer, 
  ExamResult,
  ExamEvaluationRequest 
} from '../../core/models/exam.model';

@Component({
  selector: 'app-job-exam',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './job-exam.component.html',
  styleUrls: ['./job-exam.component.css']
})
export class JobExamComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private examService = inject(ExamService);

  // State signals
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  // Exam data
  applicationId = signal<number>(0);
  jobId = signal<number>(0);
  examId = signal<number>(0);
  questions = signal<ExamQuestion[]>([]);
  currentQuestionIndex = signal<number>(0);
  userAnswers = signal<UserAnswer[]>([]);
  examDuration = signal<number>(0); // in minutes
  
  // Timer
  timeRemaining = signal<number>(0); // in seconds
  timerInterval: any;
  examStartTime: Date | null = null;
  
  // UI state
  showSubmitConfirmation = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  ngOnInit(): void {
    const appId = this.route.snapshot.paramMap.get('applicationId');
    if (!appId) {
      this.error.set('Invalid application ID');
      this.isLoading.set(false);
      return;
    }

    this.applicationId.set(parseInt(appId, 10));
    this.loadExam();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private loadExam(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // First, create the exam
    this.examService.createJobExam(this.applicationId()).subscribe({
      next: (examResponse: ExamResponse) => {
        this.questions.set(examResponse.questions);
        this.examDuration.set(examResponse.examDurationInMinutes);
        this.timeRemaining.set(examResponse.examDurationInMinutes * 60); // Convert to seconds
        
        // Initialize user answers array
        const answers: UserAnswer[] = examResponse.questions.map(q => ({
          questionId: q.id,
          questionNumber: q.questionNumber,
          selectedAnswerIndex: null
        }));
        this.userAnswers.set(answers);

        // Now fetch application details to get examId and jobId
        this.examService.getApplicationDetails(this.applicationId()).subscribe({
          next: (appDetails) => {
            this.examId.set(appDetails.examId);
            this.jobId.set(appDetails.jobId);
            this.isLoading.set(false);
            
            // Start the timer
            this.examStartTime = new Date();
            this.startTimer();
          },
          error: (error) => {
            console.error('Error fetching application details:', error);
            this.error.set('Failed to load exam details. Please try again.');
            this.isLoading.set(false);
          }
        });
      },
      error: (error) => {
        console.error('Error creating exam:', error);
        this.error.set('Failed to create exam. Please try again later.');
        this.isLoading.set(false);
      }
    });
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      const remaining = this.timeRemaining();
      if (remaining <= 0) {
        this.clearTimer();
        this.autoSubmitExam();
      } else {
        this.timeRemaining.set(remaining - 1);
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private autoSubmitExam(): void {
    alert('Time is up! Your exam will be submitted automatically.');
    this.submitExam();
  }

  get currentQuestion(): ExamQuestion | undefined {
    return this.questions()[this.currentQuestionIndex()];
  }

  get totalQuestions(): number {
    return this.questions().length;
  }

  get formattedTimeRemaining(): string {
    const seconds = this.timeRemaining();
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  get isTimeCritical(): boolean {
    return this.timeRemaining() < 300; // Less than 5 minutes
  }

  selectAnswer(answerIndex: number): void {
    const currentAnswers = [...this.userAnswers()];
    const currentQuestionId = this.currentQuestion?.id;
    
    const answerIndex_found = currentAnswers.findIndex(a => a.questionId === currentQuestionId);
    if (answerIndex_found !== -1) {
      currentAnswers[answerIndex_found].selectedAnswerIndex = answerIndex;
      this.userAnswers.set(currentAnswers);
    }
  }

  isAnswerSelected(answerIndex: number): boolean {
    const currentQuestionId = this.currentQuestion?.id;
    const answer = this.userAnswers().find(a => a.questionId === currentQuestionId);
    return answer?.selectedAnswerIndex === answerIndex;
  }

  getAnswerLabel(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D, etc.
  }

  isQuestionAnswered(questionNumber: number): boolean {
    const answer = this.userAnswers().find(a => a.questionNumber === questionNumber);
    return answer?.selectedAnswerIndex !== null;
  }

  goToQuestion(index: number): void {
    if (index >= 0 && index < this.totalQuestions) {
      this.currentQuestionIndex.set(index);
    }
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex() < this.totalQuestions - 1) {
      this.currentQuestionIndex.set(this.currentQuestionIndex() + 1);
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex() > 0) {
      this.currentQuestionIndex.set(this.currentQuestionIndex() - 1);
    }
  }

  get answeredCount(): number {
    return this.userAnswers().filter(a => a.selectedAnswerIndex !== null).length;
  }

  get canSubmit(): boolean {
    return this.answeredCount === this.totalQuestions;
  }

  openSubmitConfirmation(): void {
    this.showSubmitConfirmation.set(true);
  }

  closeSubmitConfirmation(): void {
    this.showSubmitConfirmation.set(false);
  }

  submitExam(): void {
    this.closeSubmitConfirmation();
    this.isSubmitting.set(true);
    this.clearTimer();

    // Calculate exam results
    const examResult = this.calculateResults();

    // Prepare evaluation request
    const evaluationRequest: ExamEvaluationRequest = {
      applicationId: this.applicationId(),
      examId: this.examId(),
      jobId: this.jobId(),
      applicantExamScore: examResult.score,
      examTotalScore: 100,
      appliedAt: new Date().toISOString(),
      status: examResult.status
    };

    // Submit evaluation to backend
    this.examService.evaluateExam(evaluationRequest).subscribe({
      next: () => {
        // Navigate to results page with exam result data
        this.router.navigate(['/applicant/exam-results'], {
          state: { examResult }
        });
      },
      error: (error) => {
        console.error('Error submitting exam evaluation:', error);
        this.error.set('Failed to submit exam. Please try again.');
        this.isSubmitting.set(false);
        
        // Restart timer if submission failed
        if (this.timeRemaining() > 0) {
          this.startTimer();
        }
      }
    });
  }

  private calculateResults(): ExamResult {
    let correctAnswers = 0;
    
    this.questions().forEach(question => {
      const userAnswer = this.userAnswers().find(a => a.questionId === question.id);
      if (userAnswer && userAnswer.selectedAnswerIndex === question.correctAnswerIndex) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / this.totalQuestions) * 100);
    const status: 'Passed' | 'Failed' = score >= 80 ? 'Passed' : 'Failed';

    // Calculate time taken
    const timeTaken = this.calculateTimeTaken();

    return {
      applicationId: this.applicationId(),
      jobId: this.jobId(),
      examId: this.examId(),
      totalQuestions: this.totalQuestions,
      correctAnswers,
      score,
      status,
      timeTaken,
      appliedAt: new Date().toISOString(),
      questions: this.questions(),
      userAnswers: this.userAnswers()
    };
  }

  private calculateTimeTaken(): string {
    if (!this.examStartTime) return '0:00';
    
    const endTime = new Date();
    const diffMs = endTime.getTime() - this.examStartTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffSeconds = Math.floor((diffMs % 60000) / 1000);
    
    return `${diffMinutes}:${diffSeconds.toString().padStart(2, '0')}`;
  }

  retryLoadExam(): void {
    this.loadExam();
  }
}
