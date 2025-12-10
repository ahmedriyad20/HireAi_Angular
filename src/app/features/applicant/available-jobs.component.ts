import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { throwError, of } from 'rxjs';
import { JobOpening, JobFilters, JobStatus, ExperienceLevel, EmploymentType } from '../../core/models/job.model';
import { AvailableJobsService, JobResponse } from '../../core/services/available-jobs.service';
import { ApplicationsService, CreateApplicationRequest } from '../../core/services/applications.service';
import { AuthService } from '../../core/services/auth.service';
import { ApplicationProgressModalComponent, ModalStep, AnalysisResult } from '../../shared/components/application-progress-modal.component';

@Component({
  selector: 'app-available-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule, ApplicationProgressModalComponent],
  templateUrl: './available-jobs.component.html',
  styleUrls: ['./available-jobs.component.css']
})
export class AvailableJobsComponent implements OnInit {
  allJobs = signal<JobOpening[]>([]);
  filters = signal<JobFilters>({});
  loading = signal(false);
  viewMode = signal<'grid' | 'list'>('grid');
  appliedJobIds = signal<Set<number>>(new Set());
  checkingApplications = signal(false);
  
  // Application Progress Modal
  showProgressModal = signal(false);
  modalStep = signal<ModalStep>('idle');
  modalError = signal('');
  analysisResult = signal<AnalysisResult | null>(null);
  pendingApplicationId = signal<number | null>(null);
  showRetryButton = signal(false);
  applying = signal(false);
  
  // Confirmation Modal
  showConfirmModal = signal(false);
  jobToApply = signal<number | null>(null);
  
  // Duplicate Application Modal
  showDuplicateModal = signal(false);
  
  // Pagination
  currentPage = signal(1);
  itemsPerPage = 12;
  Math = Math; // For template use

  // Enums for template
  JobStatus = JobStatus;
  ExperienceLevel = ExperienceLevel;
  EmploymentType = EmploymentType;

  // Filter options
  experienceLevels = Object.values(ExperienceLevel);
  employmentTypes = Object.values(EmploymentType);
  locations = signal<string[]>([]);

  // Dropdown labels
  selectedExperienceLabel = signal<string>('All Levels');
  selectedEmploymentLabel = signal<string>('All Types');
  selectedLocationLabel = signal<string>('All Locations');
  selectedApplicationStatusLabel = signal<string>('All Jobs');

  // Services
  private readonly router = inject(Router);
  private readonly jobsService = inject(AvailableJobsService);
  private readonly route = inject(ActivatedRoute);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly authService = inject(AuthService);

  ngOnInit() {
    this.loadJobs();
    this.loadAppliedJobs();
    
    // Listen for query parameters from search
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.updateFilter('searchQuery', params['search']);
      }
    });
  }

  filteredJobs = computed(() => {
    const jobs = this.allJobs();
    const filters = this.filters();

    return jobs.filter(job => {
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch = 
          job.title.toLowerCase().includes(query) ||
          job.companyName.toLowerCase().includes(query) ||
          job.description?.toLowerCase().includes(query) ||
          job.location?.toLowerCase().includes(query);
        
        if (!matchesSearch) return false;
      }

      // Experience level filter
      if (filters.experienceLevel && job.experienceLevel !== filters.experienceLevel) {
        return false;
      }

      // Employment type filter
      if (filters.employmentType && job.employmentType !== filters.employmentType) {
        return false;
      }

      // Location filter
      if (filters.location && job.location !== filters.location) {
        return false;
      }

      // Application status filter
      if (filters.applicationStatus && filters.applicationStatus !== 'all') {
        const hasApplied = this.hasAppliedToJob(job.id);
        if (filters.applicationStatus === 'applied' && !hasApplied) {
          return false;
        }
        if (filters.applicationStatus === 'notApplied' && hasApplied) {
          return false;
        }
      }

      // Only show active jobs
      if (job.jobStatus !== JobStatus.Active) {
        return false;
      }

      return true;
    });
  });

  paginatedJobs = computed(() => {
    const filtered = this.filteredJobs();
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return filtered.slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredJobs().length / this.itemsPerPage);
  });

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    // Always show first page
    pages.push(1);
    
    // Show pages around current page
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }
    
    // Always show last page
    if (total > 1 && !pages.includes(total)) {
      pages.push(total);
    }
    
    return pages;
  });

  loadJobs() {
    this.loading.set(true);
    
    this.jobsService.getAvailableJobs().subscribe({
      next: (response: JobResponse[]) => {
        const jobs: JobOpening[] = response.map((job) => ({
          id: job.jobId,
          title: job.title,
          companyName: job.companyName,
          description: job.description,
          createdAt: new Date(job.createdAt),
          jobStatus: job.jobStatus as JobStatus,
          examDurationMinutes: job.examDurationMinutes,
          experienceLevel: job.experienceLevel as ExperienceLevel,
          employmentType: job.employmentType as EmploymentType,
          location: job.location,
          salaryRange: job.salaryRange,
          numberOfQuestions: job.numberOfQuestions,
          applicationDeadline: new Date(job.applicationDeadline),
          atsMinimumScore: job.atsMinimumScore,
          hrId: job.hrId
        }));;
        
        this.allJobs.set(jobs);
        
        // Extract unique locations
        const uniqueLocations = [...new Set(jobs.map(j => j.location).filter(l => l))];
        this.locations.set(uniqueLocations as string[]);
        
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading jobs:', error);
        this.loading.set(false);
        // Optionally show error message to user
      }
    });
  }

  getJobIcon(title: string): string {
    return this.jobsService.getJobIcon(title);
  }

  updateFilter(key: keyof JobFilters, value: any) {
    this.filters.update(filters => ({
      ...filters,
      [key]: value || undefined
    }));

    // Update dropdown labels
    if (key === 'experienceLevel') {
      this.selectedExperienceLabel.set(value ? this.getExperienceLevelDisplay(value) : 'All Levels');
    } else if (key === 'employmentType') {
      this.selectedEmploymentLabel.set(value ? this.getEmploymentTypeDisplay(value) : 'All Types');
    } else if (key === 'location') {
      this.selectedLocationLabel.set(value || 'All Locations');
    } else if (key === 'applicationStatus') {
      this.selectedApplicationStatusLabel.set(this.getApplicationStatusDisplay(value));
    }
    
    // Reset to first page when filters change
    this.currentPage.set(1);
  }

  clearFilters() {
    this.filters.set({});
    this.selectedExperienceLabel.set('All Levels');
    this.selectedEmploymentLabel.set('All Types');
    this.selectedLocationLabel.set('All Locations');
    this.selectedApplicationStatusLabel.set('All Jobs');
  }

  viewJobDetails(jobId: number | undefined, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (jobId) {
      this.router.navigate(['/applicant/jobs', jobId]);
    }
  }

  loadAppliedJobs(): void {
    const userId = this.authService.getUserId();
    if (!userId) return;
    
    const applicantId = parseInt(userId, 10);
    if (isNaN(applicantId)) return;

    this.checkingApplications.set(true);
    this.applicationsService.getApplicationsList(applicantId).subscribe({
      next: (applications) => {
        const jobIds = new Set(applications.map(app => app.jobId));
        this.appliedJobIds.set(jobIds);
        this.checkingApplications.set(false);
      },
      error: (error) => {
        console.error('Error loading applied jobs:', error);
        this.checkingApplications.set(false);
      }
    });
  }

  hasAppliedToJob(jobId: number | undefined): boolean {
    if (!jobId) return false;
    return this.appliedJobIds().has(jobId);
  }

  applyForJob(jobId: number | undefined, event: Event) {
    event.stopPropagation();
    
    if (!jobId) {
      alert('Invalid job ID');
      return;
    }

    // Check if already applied
    if (this.hasAppliedToJob(jobId)) {
      this.showDuplicateModal.set(true);
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

    // Show confirmation modal
    this.jobToApply.set(jobId);
    this.showConfirmModal.set(true);
  }

  confirmApplication() {
    const jobId = this.jobToApply();
    if (!jobId) return;

    // Close confirmation modal
    this.showConfirmModal.set(false);
    this.jobToApply.set(null);

    // Get applicant ID
    const userId = this.authService.getUserId();
    if (!userId) return;
    
    const applicantId = parseInt(userId, 10);

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
        
        // Add to applied jobs set
        const jobId = this.jobToApply();
        if (jobId) {
          const currentAppliedJobs = new Set(this.appliedJobIds());
          currentAppliedJobs.add(jobId);
          this.appliedJobIds.set(currentAppliedJobs);
        }
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

  closeConfirmModal(): void {
    this.showConfirmModal.set(false);
    this.jobToApply.set(null);
  }

  closeDuplicateModal(): void {
    this.showDuplicateModal.set(false);
  }

  navigateToApplications(): void {
    this.closeModal();
    this.router.navigate(['/applicant/applications']);
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffTime = dateObj.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days left`;
    
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getExperienceLevelDisplay(level?: ExperienceLevel): string {
    if (!level) return 'Not specified';
    const displayMap: Record<string, string> = {
      'EntryLevel': 'Entry Level',
      'Junior': 'Junior',
      'MidLevel': 'Mid Level',
      'Senior': 'Senior',
      'TeamLead': 'Team Lead',
      'Executive': 'Executive'
    };
    return displayMap[level] || level;
  }

  getEmploymentTypeDisplay(type?: EmploymentType): string {
    if (!type) return 'Not specified';
    const displayMap: Record<string, string> = {
      'FullTime': 'Full Time',
      'PartTime': 'Part Time',
      'Internship': 'Internship',
      'FreeLance': 'Freelance'
    };
    return displayMap[type] || type;
  }

  getApplicationStatusDisplay(status?: string): string {
    const displayMap: Record<string, string> = {
      'all': 'All Jobs',
      'applied': 'Applied Jobs',
      'notApplied': 'Not Applied'
    };
    return displayMap[status || 'all'] || 'All Jobs';
  }

  isDeadlineNear(deadline?: Date | string): boolean {
    if (!deadline) return false;
    const deadlineObj = typeof deadline === 'string' ? new Date(deadline) : deadline;
    const now = new Date();
    const diffTime = deadlineObj.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  }

  hasActiveFilters(): boolean {
    const filters = this.filters();
    return !!(filters.searchQuery || filters.experienceLevel || filters.employmentType || filters.location);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      // Scroll to top of jobs section
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }
}
