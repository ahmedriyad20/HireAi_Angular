import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HRJobsService } from '../../core/services/hr-jobs.service';
import { JobOpening } from '../../core/models/job.model';

@Component({
  selector: 'app-hr-job-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hr-job-details.component.html',
  styleUrls: ['./hr-job-details.component.css']
})
export class HrJobDetailsComponent implements OnInit {
  job = signal<JobOpening | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  
  // Delete confirmation dialog
  showDeleteDialog = signal<boolean>(false);
  deleteMessage = signal<string>('');
  deleteSuccess = signal<boolean>(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private hrJobsService: HRJobsService
  ) {}

  ngOnInit(): void {
    const jobId = this.route.snapshot.paramMap.get('jobId');
    console.log('Job ID from route:', jobId);
    if (jobId) {
      this.loadJobDetails(+jobId);
    } else {
      this.error.set('Invalid job ID');
      this.loading.set(false);
    }
  }

  loadJobDetails(jobId: number): void {
    this.loading.set(true);
    this.error.set(null);
    console.log('Loading job details for ID:', jobId);
    console.log('API URL:', `http://localhost:5290/api/Job/${jobId}`);
    
    this.hrJobsService.getJobById(jobId).subscribe({
      next: (job) => {
        console.log('Job details received:', job);
        this.job.set(job);
        this.loading.set(false);
        console.log('Loading state updated to false');
      },
      error: (err) => {
        console.error('Error loading job details:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.message);
        console.error('Full error:', err);
        
        let errorMessage = 'Failed to load job details. ';
        if (err.status === 0) {
          errorMessage += 'Cannot connect to server. Please ensure the API is running on http://localhost:5290';
        } else if (err.status === 401) {
          errorMessage += 'Authentication required. Please login first.';
        } else if (err.status === 404) {
          errorMessage += 'Job not found.';
        } else if (err.status === 403) {
          errorMessage += 'Access denied.';
        } else {
          errorMessage += 'Please try again later.';
        }
        
        this.error.set(errorMessage);
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/hr/jobs']);
  }

  editJob(): void {
    const currentJob = this.job();
    if (currentJob?.id) {
      this.router.navigate(['/hr/jobs', currentJob.id, 'edit']);
    }
  }

  openDeleteDialog(): void {
    this.showDeleteDialog.set(true);
    this.deleteMessage.set('');
    this.deleteSuccess.set(false);
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog.set(false);
    this.deleteMessage.set('');
    this.deleteSuccess.set(false);
  }

  confirmDelete(): void {
    const currentJob = this.job();
    if (!currentJob?.id) return;

    this.hrJobsService.deleteJob(currentJob.id).subscribe({
      next: () => {
        this.deleteSuccess.set(true);
        this.deleteMessage.set('Job deleted successfully!');
        
        // Navigate to jobs list after 1.5 seconds
        setTimeout(() => {
          this.router.navigate(['/hr/jobs']);
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'status-active';
      case 'Closed':
        return 'status-closed';
      default:
        return 'status-default';
    }
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
