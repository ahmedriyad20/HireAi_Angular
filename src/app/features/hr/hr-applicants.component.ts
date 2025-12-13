import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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
  searchQuery: string;
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
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5290/api/Applicant';

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
      error: null,
      searchQuery: ''
    });
    this.expandedJobs.set(new Map(currentExpandedJobs));

    this.applicantsService.getJobApplications(job.jobId, hrId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Sort applications by Applied On date in descending order (newest first)
          const sortedApplications = (response.data.applications || []).sort((a, b) => {
            const dateA = new Date(a.dateApplied).getTime();
            const dateB = new Date(b.dateApplied).getTime();
            return dateB - dateA;
          });

          currentExpandedJobs.set(job.jobId, {
            isExpanded: true,
            isLoading: false,
            applications: sortedApplications,
            jobDetails: response.data,
            visibleCount: this.INITIAL_VISIBLE_COUNT,
            error: null,
            searchQuery: ''
          });
          this.expandedJobs.set(new Map(currentExpandedJobs));
        } else {
          currentExpandedJobs.set(job.jobId, {
            isExpanded: true,
            isLoading: false,
            applications: [],
            jobDetails: null,
            visibleCount: this.INITIAL_VISIBLE_COUNT,
            error: response.message || 'Failed to load applications',
            searchQuery: ''
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
          error: 'Failed to load applications. Please try again.',
          searchQuery: ''
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
   * Update search query for a job
   */
  onSearchChange(jobId: number, searchQuery: string): void {
    const currentExpandedJobs = this.expandedJobs();
    const jobState = currentExpandedJobs.get(jobId);
    
    if (jobState) {
      currentExpandedJobs.set(jobId, {
        ...jobState,
        searchQuery: searchQuery,
        visibleCount: this.INITIAL_VISIBLE_COUNT // Reset visible count when searching
      });
      this.expandedJobs.set(new Map(currentExpandedJobs));
    }
  }

  /**
   * Get filtered applications based on search query
   */
  getFilteredApplications(jobId: number): JobApplication[] {
    const jobState = this.getJobState(jobId);
    if (!jobState) return [];
    
    const query = jobState.searchQuery.toLowerCase().trim();
    
    if (!query) {
      return jobState.applications;
    }
    
    return jobState.applications.filter(app => 
      app.applicantName.toLowerCase().includes(query)
    );
  }

  /**
   * Get visible applications for a job
   */
  getVisibleApplications(jobId: number): JobApplication[] {
    const filteredApplications = this.getFilteredApplications(jobId);
    const jobState = this.getJobState(jobId);
    
    if (!jobState) return [];
    return filteredApplications.slice(0, jobState.visibleCount);
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
   * Check if there are more applications to load
   */
  hasMoreApplications(jobId: number): boolean {
    const jobState = this.getJobState(jobId);
    if (!jobState) return false;
    const filteredApplications = this.getFilteredApplications(jobId);
    return jobState.visibleCount < filteredApplications.length;
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
   * Download CV using the backend DownloadResume endpoint
   */
  downloadCV(cvKey: string): void {
    if (!cvKey) {
      console.error('CV key is missing');
      return;
    }

    // Debug: Check authentication
    const token = this.authService.getToken();
    const userRole = this.authService.getUserRole();
    console.log('Token exists:', !!token);
    console.log('User role:', userRole);
    
    if (!token) {
      console.error('No authentication token found');
      alert('You must be logged in to download CVs.');
      return;
    }

    // Extract fileKey and encode it
    const fileKey = encodeURIComponent(cvKey);
    const downloadUrl = `${this.apiUrl}/DownloadResume?fileKey=${fileKey}`;
    
    console.log('Downloading CV from:', downloadUrl);

    // Use HttpClient to download the file as a blob
    this.http.get(downloadUrl, { responseType: 'blob', observe: 'response' }).subscribe({
      next: (response) => {
        // Extract filename from content-disposition header
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `CV.pdf`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename\*?=["']?(?:UTF-8'')?([^"';]+)["']?/i);
          if (filenameMatch && filenameMatch[1]) {
            filename = decodeURIComponent(filenameMatch[1]);
          }
        }

        // Create blob URL and trigger download
        const blob = response.body;
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          window.URL.revokeObjectURL(url);
        }
      },
      error: (error) => {
        console.error('Error downloading CV:', error);
        
        // Provide more specific error messages
        if (error.status === 403) {
          console.error('403 Forbidden - Possible reasons:');
          console.error('1. User role mismatch (check if role in token is exactly "HR")');
          console.error('2. Token is invalid or expired');
          console.error('3. Backend authorization configuration issue');
          alert('Access denied. You do not have permission to download this CV.\n\nPlease check:\n- You are logged in as HR\n- Your session has not expired');
        } else if (error.status === 401) {
          alert('Unauthorized. Please log in again.');
        } else if (error.status === 404) {
          alert('CV file not found.');
        } else {
          alert('Failed to download CV. Please try again.');
        }
      }
    });
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
