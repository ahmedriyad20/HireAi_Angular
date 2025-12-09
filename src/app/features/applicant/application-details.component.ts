import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationDetailsService } from '../../core/services/application-details.service';
import { ApplicationDetails, ApplicationStatus, ExamEvaluationStatus, ExperienceLevel } from '../../core/models/application-details.model';
import { StatusTagComponent } from '../../shared/components/status-tag.component';
import { AuthService } from '../../core/services/auth.service';
import { ApplicationsService } from '../../core/services/applications.service';

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
  private authService = inject(AuthService);
  private applicationsService = inject(ApplicationsService);

  applicationDetails = signal<ApplicationDetails | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  showDeleteModal = signal<boolean>(false);
  isDeleting = signal<boolean>(false);
  private jobId: number | null = null;

  ngOnInit(): void {
    const applicationId = Number(this.route.snapshot.paramMap.get('applicationId'));
    const userId = this.authService.getUserId();
    
    if (!userId) {
      this.error.set('User not authenticated. Please login again.');
      this.isLoading.set(false);
      return;
    }
    
    const applicantId = parseInt(userId, 10);

    if (!applicationId) {
      this.error.set('Invalid application ID');
      this.isLoading.set(false);
      return;
    }

    this.loadApplicationDetails(applicationId, applicantId);
  }

  private loadApplicationDetails(applicationId: number, applicantId: number): void {
    this.isLoading.set(true);
    
    // Fetch from the Application endpoint to get jobId
    this.applicationsService.getApplicationById(applicationId).subscribe({
      next: (appData: any) => {
        console.log('Application data with jobId:', appData);
        this.jobId = appData.jobId;
        
        // Now fetch detailed application info
        this.applicationDetailsService.getApplicationDetails(applicationId, applicantId).subscribe({
          next: (data) => {
            console.log('API Response for application details:', data);
            // Merge jobId into the details
            const detailsWithJobId = { ...data, jobId: this.jobId };
            this.applicationDetails.set(detailsWithJobId as ApplicationDetails);
            this.isLoading.set(false);
          },
          error: (error) => {
            console.error('Error loading application details:', error);
            this.error.set('Failed to load application details');
            this.isLoading.set(false);
          }
        });
      },
      error: (error) => {
        console.error('Error loading application data:', error);
        // Continue with original call even if this fails
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

  viewJobDetails(): void {
    const details = this.applicationDetails();
    const jobId = details?.jobId || this.jobId;
    
    if (jobId) {
      this.router.navigate(['/applicant/jobs', jobId]);
    } else {
      console.error('Job ID not available');
      this.error.set('Unable to load job details. Job ID is missing.');
    }
  }

  goBack(): void {
    this.router.navigate(['/applicant/applications']);
  }

  openDeleteModal(): void {
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
  }

  confirmWithdrawApplication(): void {
    const details = this.applicationDetails();
    const applicationId = details?.applicationId || (details as any)?.id;
    
    if (!applicationId) {
      console.error('Application ID not found');
      return;
    }

    this.isDeleting.set(true);
    this.applicationsService.deleteApplication(applicationId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        this.router.navigate(['/applicant/applications']);
      },
      error: (error) => {
        console.error('Error withdrawing application:', error);
        this.isDeleting.set(false);
        this.error.set('Failed to withdraw application. Please try again.');
        this.closeDeleteModal();
      }
    });
  }
}
