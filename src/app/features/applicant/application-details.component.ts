import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationDetailsService } from '../../core/services/application-details.service';
import { ApplicationDetails, ApplicationStatus, ExamEvaluationStatus, ExperienceLevel } from '../../core/models/application-details.model';
import { StatusTagComponent } from '../../shared/components/status-tag.component';

@Component({
  selector: 'app-application-details',
  standalone: true,
  imports: [CommonModule, StatusTagComponent],
  templateUrl: './application-details.component.html',
  styleUrls: ['./application-details.component.css']
})
export class ApplicationDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private applicationDetailsService = inject(ApplicationDetailsService);

  applicationDetails = signal<ApplicationDetails | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const applicationId = Number(this.route.snapshot.paramMap.get('applicationId'));
    const applicantId = Number(this.route.snapshot.paramMap.get('applicantId'));

    if (!applicationId || !applicantId) {
      this.error.set('Invalid application or applicant ID');
      this.isLoading.set(false);
      return;
    }

    this.loadApplicationDetails(applicationId, applicantId);
  }

  private loadApplicationDetails(applicationId: number, applicantId: number): void {
    this.isLoading.set(true);
    this.applicationDetailsService.getApplicationDetails(applicationId, applicantId).subscribe({
      next: (data) => {
        this.applicationDetails.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading application details:', error);
        this.error.set('Failed to load application details');
        this.isLoading.set(false);
      }
    });
  }

  getStatusText(status: ApplicationStatus): string {
    const statusMap: { [key in ApplicationStatus]: string } = {
      'ExamSent': 'Exam Sent',
      'ATSPassed': 'ATS Passed',
      'UnderReview': 'Under Review',
      'Completed': 'Completed',
      'Rejected': 'Rejected'
    };
    return statusMap[status];
  }

  getStatusClass(status: ApplicationStatus): ApplicationStatus {
    return status;
  }

  getExamStatusText(status: ExamEvaluationStatus): string {
    const statusMap: { [key in ExamEvaluationStatus]: string } = {
      'Pending': 'Pending',
      'Passed': 'Passed',
      'Failed': 'Failed'
    };
    return statusMap[status];
  }

  getExperienceLevelText(level: ExperienceLevel): string {
    const levelMap: { [key in ExperienceLevel]: string } = {
      'EntryLevel': 'Entry Level',
      'Junior': 'Junior',
      'MidLevel': 'Mid Level',
      'Senior': 'Senior',
      'TeamLead': 'Team Lead',
      'Executive': 'Executive'
    };
    return levelMap[level];
  }

  getApplicationStatusOrder(status: ApplicationStatus): number {
    const orderMap: { [key in ApplicationStatus]: number } = {
      'UnderReview': 0,
      'ATSPassed': 1,
      'ExamSent': 2,
      'Completed': 3,
      'Rejected': -1
    };
    return orderMap[status];
  }

  isExamPassed(): boolean {
    return this.applicationDetails()?.examEvaluationStatus === 'Passed';
  }

  isExamFailed(): boolean {
    return this.applicationDetails()?.examEvaluationStatus === 'Failed';
  }

  goBack(): void {
    this.router.navigate(['/applicant/applications']);
  }
}
