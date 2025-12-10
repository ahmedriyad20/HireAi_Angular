import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HrApplicantsService } from '../../core/services/hr-applicants.service';
import { AuthService } from '../../core/services/auth.service';
import { HrJobSummary, JobApplication, JobApplicationsData } from '../../core/models/hr-applicants.model';

interface ExpandedJobState {
  isExpanded: boolean;
  isLoading: boolean;
  applications: JobApplication[];
  jobDetails: JobApplicationsData | null;
  visibleCount: number;
  error: string | null;
}

@Component({
  selector: 'app-hr-applicants',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hr-applicants.component.html',
  styleUrls: ['./hr-applicants.component.css']
})
export class HrApplicantsComponent implements OnInit {
  private applicantsService = inject(HrApplicantsService);
  private authService = inject(AuthService);

  // State signals
  jobs = signal<HrJobSummary[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  expandedJobs = signal<Map<number, ExpandedJobState>>(new Map());

  // Constants
  readonly INITIAL_VISIBLE_COUNT = 7;
  readonly LOAD_MORE_INCREMENT = 7;

  ngOnInit(): void {
    this.loadHrJobs();
  }

  /**
   * Load all jobs for the current HR user
   */
  private loadHrJobs(): void {
    const userId = this.authService.getUserId();
    
    if (!userId) {
      console.error('User ID not found');
      this.error.set('User not authenticated. Please login again.');
      this.isLoading.set(false);
      return;
    }

    const hrId = parseInt(userId, 10);
    
    this.applicantsService.getHrJobs(hrId).subscribe({
      next: (response) => {
        if (response.success) {
          this.jobs.set(response.data);
          this.error.set(null);
        } else {
          this.error.set(response.message || 'Failed to load jobs');
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading jobs:', error);
        if (error.status === 403) {
          this.error.set('Access denied. You do not have permission to view this data.');
        } else if (error.status === 401) {
          this.error.set('Session expired. Please login again.');
        } else {
          this.error.set('Failed to load jobs. Please try again later.');
        }
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Toggle job expansion and load applications if needed
   */
  toggleJob(job: HrJobSummary): void {
    const currentExpandedJobs = this.expandedJobs();
    const jobState = currentExpandedJobs.get(job.jobId);

    if (jobState && jobState.isExpanded) {
      // Collapse the job
      currentExpandedJobs.set(job.jobId, { ...jobState, isExpanded: false });
      this.expandedJobs.set(new Map(currentExpandedJobs));
    } else {
      // Expand the job
      if (!jobState || !jobState.applications.length) {
        // Load applications if not already loaded
        this.loadJobApplications(job);
      } else {
        // Just expand with existing data
        currentExpandedJobs.set(job.jobId, { ...jobState, isExpanded: true });
        this.expandedJobs.set(new Map(currentExpandedJobs));
      }
    }
  }

  /**
   * Load applications for a specific job
   */
  private loadJobApplications(job: HrJobSummary): void {
    const userId = this.authService.getUserId();
    if (!userId) return;

    const hrId = parseInt(userId, 10);
    const currentExpandedJobs = this.expandedJobs();

    // Set loading state
    currentExpandedJobs.set(job.jobId, {
      isExpanded: true,
      isLoading: true,
      applications: [],
      jobDetails: null,
      visibleCount: this.INITIAL_VISIBLE_COUNT,
      error: null
    });
    this.expandedJobs.set(new Map(currentExpandedJobs));

    this.applicantsService.getJobApplications(job.jobId, hrId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          currentExpandedJobs.set(job.jobId, {
            isExpanded: true,
            isLoading: false,
            applications: response.data.applications || [],
            jobDetails: response.data,
            visibleCount: this.INITIAL_VISIBLE_COUNT,
            error: null
          });
          this.expandedJobs.set(new Map(currentExpandedJobs));
        } else {
          currentExpandedJobs.set(job.jobId, {
            isExpanded: true,
            isLoading: false,
            applications: [],
            jobDetails: null,
            visibleCount: this.INITIAL_VISIBLE_COUNT,
            error: response.message || 'Failed to load applications'
          });
          this.expandedJobs.set(new Map(currentExpandedJobs));
        }
      },
      error: (error) => {
        console.error('Error loading applications:', error);
        currentExpandedJobs.set(job.jobId, {
          isExpanded: true,
          isLoading: false,
          applications: [],
          jobDetails: null,
          visibleCount: this.INITIAL_VISIBLE_COUNT,
          error: 'Failed to load applications. Please try again.'
        });
        this.expandedJobs.set(new Map(currentExpandedJobs));
      }
    });
  }

  /**
   * Load more applications for a specific job
   */
  loadMoreApplications(jobId: number): void {
    const currentExpandedJobs = this.expandedJobs();
    const jobState = currentExpandedJobs.get(jobId);

    if (jobState) {
      currentExpandedJobs.set(jobId, {
        ...jobState,
        visibleCount: jobState.visibleCount + this.LOAD_MORE_INCREMENT
      });
      this.expandedJobs.set(new Map(currentExpandedJobs));
    }
  }

  /**
   * Get the expanded state for a job
   */
  getJobState(jobId: number): ExpandedJobState | undefined {
    return this.expandedJobs().get(jobId);
  }

  /**
   * Check if a job is expanded
   */
  isJobExpanded(jobId: number): boolean {
    return this.getJobState(jobId)?.isExpanded || false;
  }

  /**
   * Get visible applications for a job
   */
  getVisibleApplications(jobId: number): JobApplication[] {
    const jobState = this.getJobState(jobId);
    if (!jobState) return [];
    return jobState.applications.slice(0, jobState.visibleCount);
  }

  /**
   * Check if there are more applications to load
   */
  hasMoreApplications(jobId: number): boolean {
    const jobState = this.getJobState(jobId);
    if (!jobState) return false;
    return jobState.visibleCount < jobState.applications.length;
  }

  /**
   * Get status badge class based on application status
   */
  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'ATSPassed': 'status-passed',
      'Rejected': 'status-rejected',
      'Completed': 'status-completed',
      'UnderReview': 'status-review',
      'ExamSent': 'status-sent'
    };
    return statusMap[status] || 'status-default';
  }

  /**
   * Get exam status badge class
   */
  getExamStatusClass(examStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'Completed': 'exam-completed',
      'NotTaken': 'exam-not-taken',
      'InProgress': 'exam-in-progress'
    };
    return statusMap[examStatus] || 'exam-default';
  }

  /**
   * Format date to readable string
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  /**
   * Download CV
   */
  downloadCV(cvKey: string): void {
    // If cvKey is a full URL, open it
    if (cvKey.startsWith('http')) {
      window.open(cvKey, '_blank');
    } else {
      // Otherwise, construct the full URL (adjust base URL as needed)
      const baseUrl = 'http://localhost:5290/';
      window.open(`${baseUrl}${cvKey}`, '_blank');
    }
  }

  /**
   * Get job status badge class
   */
  getJobStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Active': 'job-active',
      'Closed': 'job-closed',
      'Draft': 'job-draft'
    };
    return statusMap[status] || 'job-default';
  }
}
