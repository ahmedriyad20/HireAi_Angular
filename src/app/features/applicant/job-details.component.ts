import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { JobDetailsService, JobDetailsResponse } from '../../core/services/job-details.service';
import { ApplicationsService, CreateApplicationRequest } from '../../core/services/applications.service';
import { AuthService } from '../../core/services/auth.service';
import { AvailableJobsService } from '../../core/services/available-jobs.service';
import { ApplicationProgressModalComponent, ModalStep, AnalysisResult } from '../../shared/components/application-progress-modal.component';
import { forkJoin } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-job-details',
  standalone: true,
  imports: [CommonModule, ApplicationProgressModalComponent],
  templateUrl: './job-details.component.html',
  styleUrls: ['./job-details.component.css']
})
export class JobDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly jobDetailsService = inject(JobDetailsService);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly authService = inject(AuthService);
  private readonly jobsService = inject(AvailableJobsService);

  jobDetails = signal<JobDetailsResponse | null>(null);
  totalApplications = signal<number>(0);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  jobId = signal<number>(0);
  hasAlreadyApplied = signal<boolean>(false);
  checkingApplication = signal<boolean>(false);
  
  // Application Progress Modal
  showProgressModal = signal(false);
  modalStep = signal<ModalStep>('idle');
  modalError = signal('');
  analysisResult = signal<AnalysisResult | null>(null);
  pendingApplicationId = signal<number | null>(null);
  showRetryButton = signal(false);
  applying = signal(false);
  
  // Duplicate Application Modal
  showDuplicateModal = signal(false);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['jobId'];
      if (id) {
        this.jobId.set(+id);
        this.loadJobDetails(+id);
        this.checkIfAlreadyApplied(+id);
      } else {
        this.error.set('Invalid job ID');
        this.isLoading.set(false);
      }
    });
  }

  loadJobDetails(jobId: number): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Fetch both job details and applications count in parallel
    forkJoin({
      jobDetails: this.jobDetailsService.getJobDetails(jobId),
      applicationsCount: this.jobDetailsService.getApplicationsCount(jobId)
    }).subscribe({
      next: (response) => {
        this.jobDetails.set(response.jobDetails);
        this.totalApplications.set(response.applicationsCount.totalApplications);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading job details:', error);
        if (error.status === 404) {
          this.error.set('Job not found');
        } else if (error.status === 403) {
          this.error.set('Access denied. You do not have permission to view this job.');
        } else if (error.status === 401) {
          this.error.set('Your session has expired. Please login again.');
        } else {
          this.error.set('Failed to load job details. Please try again later.');
        }
        this.isLoading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/applicant/jobs']);
  }

  getExperienceLevelText(level: string): string {
    const levels: { [key: string]: string } = {
      'EntryLevel': 'Entry Level',
      'Junior': 'Junior',
      'MidLevel': 'Mid Level',
      'Senior': 'Senior',
      'TeamLead': 'Team Lead',
      'Executive': 'Executive'
    };
    return levels[level] || level;
  }

  getEmploymentTypeText(type: string): string {
    const types: { [key: string]: string } = {
      'FullTime': 'Full Time',
      'PartTime': 'Part Time',
      'Internship': 'Internship',
      'FreeLance': 'Freelance'
    };
    return types[type] || type;
  }

  getJobStatusClass(status: string): string {
    return status === 'Active' ? 'success' : status === 'Closed' ? 'danger' : 'secondary';
  }

  checkIfAlreadyApplied(jobId: number): void {
    const userId = this.authService.getUserId();
    if (!userId) return;
    
    const applicantId = parseInt(userId, 10);
    if (isNaN(applicantId)) return;

    this.checkingApplication.set(true);
    this.applicationsService.checkExistingApplication(applicantId, jobId).subscribe({
      next: (hasApplied) => {
        this.hasAlreadyApplied.set(hasApplied);
        this.checkingApplication.set(false);
      },
      error: (error) => {
        console.error('Error checking application status:', error);
        this.checkingApplication.set(false);
      }
    });
  }

  applyForJob(): void {
    // Check if already applied
    if (this.hasAlreadyApplied()) {
      this.showDuplicateModal.set(true);
      return;
    }

    const jobId = this.jobId();
    if (!jobId) {
      alert('Invalid job ID');
      return;
    }

    // Prevent multiple simultaneous applications
    if (this.applying()) {
      return;
    }

    // Get applicant ID from localStorage
    const userId = this.authService.getUserId();
    if (!userId) {
      alert('Please login to apply for jobs');
      this.router.navigate(['/auth/login']);
      return;
    }

    const applicantId = parseInt(userId, 10);
    if (isNaN(applicantId)) {
      alert('Invalid user session. Please login again.');
      return;
    }

    // Start application process
    this.applying.set(true);
    this.showProgressModal.set(true);
    this.modalStep.set('checking');
    this.modalError.set('');
    this.analysisResult.set(null);
    this.showRetryButton.set(false);

    // Step 1: Fetch job details to get HR ID
    this.jobsService.getJobById(jobId).pipe(
      catchError(error => {
        this.handleError('Failed to load job details. Please try again.', false);
        return throwError(() => error);
      }),
      switchMap(jobDetails => {
        if (!jobDetails.hrId) {
          this.handleError('Job information is incomplete. Please contact support.', false);
          return throwError(() => new Error('No HR ID found'));
        }

        // Step 2: Fetch applicant data to get resume URL
        this.modalStep.set('fetching');
        return this.applicationsService.getApplicantData(applicantId).pipe(
          catchError(error => {
            this.handleError('Failed to retrieve your profile data. Please ensure your profile is complete.', false);
            return throwError(() => error);
          }),
          switchMap(applicantData => {
            if (!applicantData.resumeUrl) {
              this.handleError('No CV found in your profile. Please upload a CV in your profile settings before applying.', false);
              return throwError(() => new Error('No CV found'));
            }

            // Step 3: Create application
            this.modalStep.set('creating');
            const createRequest: CreateApplicationRequest = {
              applicantId: applicantId,
              jobId: jobId,
              hrId: jobDetails.hrId,
              cvFilePath: applicantData.resumeUrl,
              applicationStatus: 'UnderReview'
            };

            return this.applicationsService.createApplication(createRequest);
          })
        );
      }),
      catchError(error => {
        // Check if error is from previous step
        if (error.message === 'No CV found') {
          return throwError(() => error);
        }
        
        // Handle duplicate application error
        if (error.status === 400 || error.error?.message?.toLowerCase().includes('already applied')) {
          this.handleError('You have already applied for this position. Please check your applications page.', false);
          this.hasAlreadyApplied.set(true);
        } else {
          this.handleError('Failed to create application. ' + (error.error?.message || error.message || 'Please try again later.'), false);
        }
        return throwError(() => error);
      }),
      switchMap(createResponse => {
        this.pendingApplicationId.set(createResponse.id);
        
        // Step 4: Analyze CV with AI
        this.modalStep.set('analyzing');
        return this.applicationsService.analyzeApplication(createResponse.id);
      }),
      catchError(error => {
        // If analysis fails, show retry option
        this.handleError(
          'Your application was submitted successfully, but CV analysis failed. ' +
          (error.error?.message || error.message || 'You can retry the analysis or check your application later.'),
          true // Show retry button
        );
        return throwError(() => error);
      })
    ).subscribe({
      next: (analysisResponse) => {
        // Success! Show results
        this.modalStep.set('success');
        this.analysisResult.set({
          applicationId: analysisResponse.applicationId,
          atsScore: analysisResponse.atsScore,
          status: analysisResponse.status,
          feedback: analysisResponse.feedback,
          skillsFound: analysisResponse.skillsFound,
          skillsGaps: analysisResponse.skillsGaps
        });
        this.applying.set(false);
        this.hasAlreadyApplied.set(true);
      },
      error: (error) => {
        console.error('Application process error:', error);
        this.applying.set(false);
      }
    });
  }

  private handleError(message: string, showRetry: boolean): void {
    this.modalStep.set('error');
    this.modalError.set(message);
    this.showRetryButton.set(showRetry);
    this.applying.set(false);
  }

  retryAnalysis(): void {
    const applicationId = this.pendingApplicationId();
    if (!applicationId) {
      alert('No pending application to retry. Please try applying again.');
      this.closeModal();
      return;
    }

    // Reset modal state and start analyzing
    this.applying.set(true);
    this.modalStep.set('analyzing');
    this.modalError.set('');
    this.showRetryButton.set(false);

    this.applicationsService.analyzeApplication(applicationId).subscribe({
      next: (analysisResponse) => {
        // Success! Show results
        this.modalStep.set('success');
        this.analysisResult.set({
          applicationId: analysisResponse.applicationId,
          atsScore: analysisResponse.atsScore,
          status: analysisResponse.status,
          feedback: analysisResponse.feedback,
          skillsFound: analysisResponse.skillsFound,
          skillsGaps: analysisResponse.skillsGaps
        });
        this.applying.set(false);
        this.pendingApplicationId.set(null);
      },
      error: (error) => {
        console.error('Retry analysis error:', error);
        this.handleError(
          'CV analysis failed again. ' + (error.error?.message || error.message || 'Please check your application later in the applications page.'),
          true // Allow another retry
        );
      }
    });
  }

  closeModal(): void {
    this.showProgressModal.set(false);
    this.modalStep.set('idle');
    this.modalError.set('');
    this.analysisResult.set(null);
    this.showRetryButton.set(false);
    this.applying.set(false);
  }

  closeDuplicateModal(): void {
    this.showDuplicateModal.set(false);
  }

  navigateToApplications(): void {
    this.closeModal();
    this.router.navigate(['/applicant/applications']);
  }
}
