import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ModalStep = 'idle' | 'checking' | 'fetching' | 'creating' | 'analyzing' | 'success' | 'error';

export interface AnalysisResult {
  applicationId: number;
  atsScore: number;
  status: string;
  feedback: string;
  skillsFound: string[];
  skillsGaps: string[];
}

@Component({
  selector: 'app-application-progress-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <h3 class="modal-title">
            <i class="bi" [ngClass]="getHeaderIcon()"></i>
            {{ getHeaderTitle() }}
          </h3>
          <button 
            *ngIf="currentStep === 'error' || currentStep === 'success'" 
            class="close-btn" 
            (click)="onClose()"
            aria-label="Close">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- Progress Steps -->
        <div class="modal-body" *ngIf="currentStep !== 'success' && currentStep !== 'error'">
          <div class="progress-steps">
            <!-- Checking for duplicates -->
            <div class="step" [class.active]="currentStep === 'checking'" [class.completed]="isStepCompleted('checking')">
              <div class="step-icon">
                <i class="bi" [ngClass]="getStepIcon('checking')"></i>
              </div>
              <div class="step-content">
                <h4>Checking Application Status</h4>
                <p>Verifying if you've already applied...</p>
              </div>
            </div>

            <!-- Fetching applicant data -->
            <div class="step" [class.active]="currentStep === 'fetching'" [class.completed]="isStepCompleted('fetching')">
              <div class="step-icon">
                <i class="bi" [ngClass]="getStepIcon('fetching')"></i>
              </div>
              <div class="step-content">
                <h4>Retrieving Your Profile</h4>
                <p>Loading your CV and profile information...</p>
              </div>
            </div>

            <!-- Creating application -->
            <div class="step" [class.active]="currentStep === 'creating'" [class.completed]="isStepCompleted('creating')">
              <div class="step-icon">
                <i class="bi" [ngClass]="getStepIcon('creating')"></i>
              </div>
              <div class="step-content">
                <h4>Creating Application</h4>
                <p>Submitting your application to the company...</p>
              </div>
            </div>

            <!-- Analyzing CV -->
            <div class="step" [class.active]="currentStep === 'analyzing'" [class.completed]="isStepCompleted('analyzing')">
              <div class="step-icon">
                <i class="bi" [ngClass]="getStepIcon('analyzing')"></i>
              </div>
              <div class="step-content">
                <h4>AI CV Analysis</h4>
                <p>Analyzing your CV with AI technology...</p>
                <small class="text-muted">This may take up to 30 seconds</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Success State -->
        <div class="modal-body" *ngIf="currentStep === 'success' && analysisResult">
          <div class="success-content">
            <div class="success-icon">
              <i class="bi bi-check-circle-fill"></i>
            </div>
            <h4>Application Submitted Successfully!</h4>
            
            <!-- ATS Score -->
            <div class="ats-score-card">
              <div class="score-badge" [class.high-score]="analysisResult.atsScore >= 80" 
                   [class.medium-score]="analysisResult.atsScore >= 60 && analysisResult.atsScore < 80"
                   [class.low-score]="analysisResult.atsScore < 60">
                <span class="score-number">{{ analysisResult.atsScore }}</span>
                <span class="score-label">ATS Score</span>
              </div>
              <div class="status-badge" [class.passed]="analysisResult.status === 'ATSPassed'" 
                   [class.rejected]="analysisResult.status === 'Rejected'">
                {{ getStatusDisplay(analysisResult.status) }}
              </div>
            </div>

            <!-- Feedback -->
            <div class="feedback-section">
              <h5><i class="bi bi-chat-left-text"></i> AI Feedback</h5>
              <p class="feedback-text">{{ analysisResult.feedback }}</p>
            </div>

            <!-- Skills Found -->
            <div class="skills-section" *ngIf="analysisResult.skillsFound.length > 0">
              <h5><i class="bi bi-check-circle"></i> Skills Matched ({{ analysisResult.skillsFound.length }})</h5>
              <div class="skills-tags">
                <span class="skill-tag found" *ngFor="let skill of analysisResult.skillsFound.slice(0, 10)">
                  {{ skill }}
                </span>
                <span class="skill-tag more" *ngIf="analysisResult.skillsFound.length > 10">
                  +{{ analysisResult.skillsFound.length - 10 }} more
                </span>
              </div>
            </div>

            <!-- Skills Gaps -->
            <div class="skills-section" *ngIf="analysisResult.skillsGaps.length > 0">
              <h5><i class="bi bi-exclamation-circle"></i> Skills to Improve</h5>
              <div class="skills-tags">
                <span class="skill-tag gap" *ngFor="let skill of analysisResult.skillsGaps">
                  {{ skill }}
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons">
              <button class="btn btn-primary" (click)="onViewApplications()">
                <i class="bi bi-list-ul"></i> View My Applications
              </button>
              <button class="btn btn-secondary" (click)="onClose()">
                <i class="bi bi-x-circle"></i> Stay Here
              </button>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div class="modal-body" *ngIf="currentStep === 'error'">
          <div class="error-content">
            <div class="error-icon">
              <i class="bi bi-exclamation-triangle-fill"></i>
            </div>
            <h4>{{ getErrorTitle() }}</h4>
            <p class="error-message">{{ errorMessage }}</p>
            
            <!-- Action Buttons -->
            <div class="action-buttons">
              <button 
                *ngIf="showRetryButton" 
                class="btn btn-warning" 
                (click)="onRetry()">
                <i class="bi bi-arrow-clockwise"></i> Retry Analysis
              </button>
              <button class="btn btn-secondary" (click)="onClose()">
                <i class="bi bi-x-circle"></i> Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease-in-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 600px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateY(50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      padding: 24px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .modal-title i {
      font-size: 1.75rem;
    }

    .close-btn {
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      transition: all 0.2s;
      font-size: 1.25rem;
    }

    .close-btn:hover {
      background: #f3f4f6;
      color: #1f2937;
    }

    .modal-body {
      padding: 24px;
    }

    /* Progress Steps */
    .progress-steps {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .step {
      display: flex;
      gap: 16px;
      opacity: 0.5;
      transition: all 0.3s ease;
    }

    .step.active {
      opacity: 1;
    }

    .step.completed {
      opacity: 0.7;
    }

    .step-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3f4f6;
      color: #6b7280;
      font-size: 1.5rem;
      flex-shrink: 0;
      transition: all 0.3s;
    }

    .step.active .step-icon {
      background: #3b82f6;
      color: white;
      animation: pulse 2s infinite;
    }

    .step.completed .step-icon {
      background: #10b981;
      color: white;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }

    .step-content h4 {
      margin: 0 0 4px 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
    }

    .step-content p {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .step-content small {
      display: block;
      margin-top: 4px;
      font-size: 0.75rem;
    }

    /* Success Content */
    .success-content {
      text-align: center;
    }

    .success-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background: #d1fae5;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #10b981;
      font-size: 3rem;
      animation: scaleIn 0.4s ease-out;
    }

    @keyframes scaleIn {
      from {
        transform: scale(0);
      }
      to {
        transform: scale(1);
      }
    }

    .success-content h4 {
      margin: 0 0 24px 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
    }

    .ats-score-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .score-badge {
      text-align: left;
    }

    .score-number {
      display: block;
      font-size: 3rem;
      font-weight: 700;
      line-height: 1;
    }

    .score-label {
      display: block;
      font-size: 0.875rem;
      opacity: 0.9;
      margin-top: 4px;
    }

    .status-badge {
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 1rem;
      background: rgba(255, 255, 255, 0.2);
    }

    .status-badge.passed {
      background: rgba(16, 185, 129, 0.3);
    }

    .status-badge.rejected {
      background: rgba(239, 68, 68, 0.3);
    }

    .feedback-section {
      background: #f9fafb;
      border-left: 4px solid #3b82f6;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      text-align: left;
    }

    .feedback-section h5 {
      margin: 0 0 8px 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1f2937;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .feedback-text {
      margin: 0;
      font-size: 0.875rem;
      color: #4b5563;
      line-height: 1.6;
    }

    .skills-section {
      margin-bottom: 20px;
      text-align: left;
    }

    .skills-section h5 {
      margin: 0 0 12px 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1f2937;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .skills-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .skill-tag {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .skill-tag.found {
      background: #d1fae5;
      color: #065f46;
    }

    .skill-tag.gap {
      background: #fed7aa;
      color: #92400e;
    }

    .skill-tag.more {
      background: #e5e7eb;
      color: #6b7280;
    }

    /* Error Content */
    .error-content {
      text-align: center;
    }

    .error-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background: #fee2e2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ef4444;
      font-size: 3rem;
      animation: shake 0.5s ease-out;
    }

    @keyframes shake {
      0%, 100% {
        transform: translateX(0);
      }
      25% {
        transform: translateX(-10px);
      }
      75% {
        transform: translateX(10px);
      }
    }

    .error-content h4 {
      margin: 0 0 12px 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
    }

    .error-message {
      margin: 0 0 24px 0;
      font-size: 0.875rem;
      color: #6b7280;
      line-height: 1.6;
    }

    /* Action Buttons */
    .action-buttons {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 24px;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    .btn-secondary {
      background: #e5e7eb;
      color: #1f2937;
    }

    .btn-secondary:hover {
      background: #d1d5db;
    }

    .btn-warning {
      background: #f59e0b;
      color: white;
    }

    .btn-warning:hover {
      background: #d97706;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    }

    /* Scrollbar */
    .modal-content::-webkit-scrollbar {
      width: 8px;
    }

    .modal-content::-webkit-scrollbar-track {
      background: #f3f4f6;
    }

    .modal-content::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 4px;
    }

    .modal-content::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }

    .text-muted {
      color: #9ca3af;
    }
  `]
})
export class ApplicationProgressModalComponent {
  @Input() isOpen = false;
  @Input() currentStep: ModalStep = 'idle';
  @Input() errorMessage = '';
  @Input() analysisResult: AnalysisResult | null = null;
  @Input() showRetryButton = false;

  @Output() close = new EventEmitter<void>();
  @Output() viewApplications = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();

  private stepOrder: ModalStep[] = ['checking', 'fetching', 'creating', 'analyzing'];

  getHeaderIcon(): string {
    switch (this.currentStep) {
      case 'success':
        return 'bi-check-circle-fill text-success';
      case 'error':
        return 'bi-exclamation-triangle-fill text-danger';
      default:
        return 'bi-hourglass-split text-primary';
    }
  }

  getHeaderTitle(): string {
    switch (this.currentStep) {
      case 'success':
        return 'Application Successful';
      case 'error':
        return 'Application Error';
      default:
        return 'Processing Your Application';
    }
  }

  getErrorTitle(): string {
    if (this.errorMessage.toLowerCase().includes('already applied')) {
      return 'Already Applied';
    } else if (this.errorMessage.toLowerCase().includes('profile')) {
      return 'Profile Error';
    } else if (this.errorMessage.toLowerCase().includes('application')) {
      return 'Application Error';
    } else if (this.errorMessage.toLowerCase().includes('analysis') || this.errorMessage.toLowerCase().includes('cv')) {
      return 'CV Analysis Error';
    }
    return 'Error Occurred';
  }

  isStepCompleted(step: ModalStep): boolean {
    const currentIndex = this.stepOrder.indexOf(this.currentStep);
    const stepIndex = this.stepOrder.indexOf(step);
    return currentIndex > stepIndex || this.currentStep === 'success';
  }

  getStepIcon(step: ModalStep): string {
    if (this.isStepCompleted(step)) {
      return 'bi-check-circle-fill';
    }
    if (this.currentStep === step) {
      return 'bi-arrow-repeat spin';
    }
    
    switch (step) {
      case 'checking':
        return 'bi-search';
      case 'fetching':
        return 'bi-person-circle';
      case 'creating':
        return 'bi-file-earmark-plus';
      case 'analyzing':
        return 'bi-cpu';
      default:
        return 'bi-circle';
    }
  }

  getStatusDisplay(status: string): string {
    const statusMap: Record<string, string> = {
      'ATSPassed': '✓ ATS Passed',
      'Rejected': '✗ Not Qualified',
      'UnderReview': 'Under Review'
    };
    return statusMap[status] || status;
  }

  onOverlayClick(event: MouseEvent): void {
    // Only allow closing on success or error states
    if (this.currentStep === 'success' || this.currentStep === 'error') {
      this.close.emit();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onViewApplications(): void {
    this.viewApplications.emit();
  }

  onRetry(): void {
    this.retry.emit();
  }
}
