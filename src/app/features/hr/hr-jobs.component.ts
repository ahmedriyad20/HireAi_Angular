import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HRJobsService } from '../../core/services/hr-jobs.service';
import { AuthService } from '../../core/services/auth.service';
import { JobOpening, JobStatus, ExperienceLevel, EmploymentType } from '../../core/models/job.model';

@Component({
  selector: 'app-hr-jobs',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './hr-jobs.component.html',
  styleUrls: ['./hr-jobs.component.css']
})
export class HrJobsComponent implements OnInit {
  private jobsService = inject(HRJobsService);
  private authService = inject(AuthService);

  jobs = signal<JobOpening[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Filter signals
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('all');
  selectedExperience = signal<string>('all');
  selectedEmploymentType = signal<string>('all');

  // View mode signal
  viewMode = signal<'grid' | 'list'>('grid');

  // Delete confirmation dialog
  showDeleteDialog = signal<boolean>(false);
  jobToDelete = signal<number | null>(null);
  deleteMessage = signal<string>('');
  deleteSuccess = signal<boolean>(false);

  // Computed filtered jobs
  filteredJobs = computed(() => {
    let filtered = this.jobs();

    // Search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(query) ||
        job.companyName.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query) ||
        job.location?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (this.selectedStatus() !== 'all') {
      filtered = filtered.filter(job => job.jobStatus === this.selectedStatus());
    }

    // Experience level filter
    if (this.selectedExperience() !== 'all') {
      filtered = filtered.filter(job => job.experienceLevel === this.selectedExperience());
    }

    // Employment type filter
    if (this.selectedEmploymentType() !== 'all') {
      filtered = filtered.filter(job => job.employmentType === this.selectedEmploymentType());
    }

    return filtered;
  });

  // Stats computed
  stats = computed(() => ({
    total: this.jobs().length,
    active: this.jobs().filter(j => j.jobStatus === 'Active').length,
    closed: this.jobs().filter(j => j.jobStatus === 'Closed').length,
    totalApplications: this.jobs().reduce((sum, j) => sum + (j.totalApplications || 0), 0)
  }));

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const userId = this.authService.getUserId();
    if (!userId) {
      this.error.set('User not authenticated. Please login again.');
      this.isLoading.set(false);
      return;
    }

    const hrId = parseInt(userId, 10);

    this.jobsService.getHRJobs(hrId).subscribe({
      next: (data) => {
        this.jobs.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading jobs:', error);
        if (error.status === 403) {
          this.error.set('Access denied. You do not have permission to view jobs.');
        } else if (error.status === 401) {
          this.error.set('Session expired. Please login again.');
        } else {
          this.error.set('Failed to load jobs. Please try again.');
        }
        this.isLoading.set(false);
      }
    });
  }

  retryLoad(): void {
    this.loadJobs();
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
    this.selectedExperience.set('all');
    this.selectedEmploymentType.set('all');
  }

  formatDate(dateString: string | Date): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getStatusBadgeClass(status: JobStatus): string {
    switch (status) {
      case 'Active':
        return 'badge-success';
      case 'Closed':
        return 'badge-secondary';
      default:
        return 'badge-light';
    }
  }

  getExperienceBadgeClass(level: ExperienceLevel): string {
    switch (level) {
      case 'EntryLevel':
        return 'badge-info';
      case 'Junior':
        return 'badge-primary';
      case 'MidLevel':
        return 'badge-warning';
      case 'Senior':
        return 'badge-danger';
      case 'TeamLead':
        return 'badge-purple';
      case 'Executive':
        return 'badge-dark';
      default:
        return 'badge-light';
    }
  }

  getEmploymentTypeIcon(type: EmploymentType): string {
    switch (type) {
      case 'FullTime':
        return 'briefcase-fill';
      case 'PartTime':
        return 'clock-fill';
      case 'Internship':
        return 'mortarboard-fill';
      case 'FreeLance':
        return 'laptop';
      default:
        return 'briefcase';
    }
  }

  formatExperienceLevel(level: ExperienceLevel): string {
    switch (level) {
      case 'EntryLevel':
        return 'Entry Level';
      case 'MidLevel':
        return 'Mid Level';
      case 'TeamLead':
        return 'Team Lead';
      default:
        return level;
    }
  }

  formatEmploymentType(type: EmploymentType): string {
    switch (type) {
      case 'FullTime':
        return 'Full Time';
      case 'PartTime':
        return 'Part Time';
      case 'FreeLance':
        return 'Freelance';
      default:
        return type;
    }
  }

  isDeadlineSoon(deadline: string | Date): boolean {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDeadline <= 7 && daysUntilDeadline > 0;
  }

  isDeadlinePassed(deadline: string | Date): boolean {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    return deadlineDate < today;
  }

  openDeleteDialog(jobId: number, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.jobToDelete.set(jobId);
    this.showDeleteDialog.set(true);
    this.deleteMessage.set('');
    this.deleteSuccess.set(false);
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog.set(false);
    this.jobToDelete.set(null);
    this.deleteMessage.set('');
    this.deleteSuccess.set(false);
  }

  confirmDelete(): void {
    const jobId = this.jobToDelete();
    if (!jobId) return;

    this.jobsService.deleteJob(jobId).subscribe({
      next: () => {
        // Remove the job from the local array
        this.jobs.update(jobs => jobs.filter(job => job.id !== jobId));
        this.deleteSuccess.set(true);
        this.deleteMessage.set('Job deleted successfully!');
        
        // Close dialog after 1.5 seconds
        setTimeout(() => {
          this.closeDeleteDialog();
        }, 1500);
      },
      error: (err) => {
        console.error('Error deleting job:', err);
        
        let errorMessage = 'Failed to delete job. ';
        if (err.status === 0) {
          errorMessage += 'Cannot connect to server.';
        } else if (err.status === 404) {
          errorMessage += 'Job not found.';
        } else if (err.status === 401) {
          errorMessage += 'Please login again.';
        } else if (err.status === 403) {
          errorMessage += 'You do not have permission to delete this job.';
        } else {
          errorMessage += 'Please try again later.';
        }
        
        this.deleteSuccess.set(false);
        this.deleteMessage.set(errorMessage);
      }
    });
  }
}
