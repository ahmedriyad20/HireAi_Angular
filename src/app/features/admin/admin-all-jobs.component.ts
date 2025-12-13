import { Component, signal, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { JobListItem, JobUpdateRequest } from '../../core/models/admin.model';

@Component({
  selector: 'app-admin-all-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-all-jobs.component.html',
  styleUrls: ['./admin-all-jobs.component.css']
})
export class AdminAllJobsComponent implements OnInit {
  private adminService = inject(AdminService);

  allJobs = signal<JobListItem[]>([]); // All loaded jobs
  displayedJobs = signal<JobListItem[]>([]); // Currently displayed (with pagination)
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  // Infinite scroll & pagination
  pageSize = 10; // Load 10 jobs at a time
  currentPage = 0;
  isLoadingMore = signal<boolean>(false);
  hasMoreData = signal<boolean>(true);
  
  // Search
  searchQuery = signal<string>('');
  filteredJobs = signal<JobListItem[]>([]);
  
  // Skeleton loading
  skeletons = Array(3).fill(0); // Show 3 skeleton cards initially
  
  // Update modal state
  showUpdateModal = signal<boolean>(false);
  selectedJob = signal<JobListItem | null>(null);
  updateForm: JobUpdateRequest = {
    title: '',
    companyName: '',
    description: '',
    jobStatus: 'Active',
    examDurationMinutes: 30,
    experienceLevel: 'EntryLevel',
    employmentType: 'FullTime',
    location: '',
    salaryRange: '',
    numberOfQuestions: 10,
    applicationDeadline: '',
    atsMinimumScore: 0,
    autoSend: false,
    hrId: 0,
    skillIds: []
  };
  isUpdating = signal<boolean>(false);
  
  // Delete modal state
  showDeleteModal = signal<boolean>(false);
  jobToDelete = signal<JobListItem | null>(null);
  isDeleting = signal<boolean>(false);

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.adminService.getAllJobs().subscribe({
      next: (data) => {
        this.allJobs.set(data);
        this.filteredJobs.set(data);
        this.loadMore(); // Load first page
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading jobs:', error);
        if (error.status === 403) {
          this.error.set('Access denied. You do not have admin permissions.');
        } else if (error.status === 401) {
          this.error.set('Your session has expired. Please login again.');
        } else {
          this.error.set('Failed to load jobs. Please try again later.');
        }
        this.isLoading.set(false);
      }
    });
  }

  loadMore(): void {
    if (!this.hasMoreData() || this.isLoadingMore()) return;

    this.isLoadingMore.set(true);
    
    setTimeout(() => {
      const start = this.currentPage * this.pageSize;
      const end = start + this.pageSize;
      const newJobs = this.filteredJobs().slice(start, end);
      
      if (newJobs.length > 0) {
        this.displayedJobs.update(current => [...current, ...newJobs]);
        this.currentPage++;
      }
      
      if (end >= this.filteredJobs().length) {
        this.hasMoreData.set(false);
      }
      
      this.isLoadingMore.set(false);
    }, 500);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const scrollPosition = window.pageYOffset + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;
    
    if (scrollPosition >= pageHeight - 100 && !this.isLoadingMore() && this.hasMoreData()) {
      this.loadMore();
    }
  }

  onSearch(): void {
    const query = this.searchQuery().toLowerCase().trim();
    
    if (!query) {
      this.filteredJobs.set(this.allJobs());
    } else {
      const filtered = this.allJobs().filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.companyName.toLowerCase().includes(query)
      );
      this.filteredJobs.set(filtered);
    }
    
    // Reset pagination
    this.currentPage = 0;
    this.displayedJobs.set([]);
    this.hasMoreData.set(true);
    this.loadMore();
  }

  openUpdateModal(job: JobListItem): void {
    this.selectedJob.set(job);
    this.updateForm = {
      title: job.title,
      companyName: job.companyName,
      description: job.description,
      jobStatus: job.jobStatus,
      examDurationMinutes: job.examDurationMinutes,
      experienceLevel: job.experienceLevel,
      employmentType: job.employmentType,
      location: job.location,
      salaryRange: job.salaryRange,
      numberOfQuestions: job.numberOfQuestions,
      applicationDeadline: job.applicationDeadline.split('T')[0], // Format for date input
      atsMinimumScore: job.atsMinimumScore,
      autoSend: job.autoSend,
      hrId: job.hrId,
      skillIds: []
    };
    this.showUpdateModal.set(true);
  }

  closeUpdateModal(): void {
    this.showUpdateModal.set(false);
    this.selectedJob.set(null);
  }

  submitUpdate(): void {
    const job = this.selectedJob();
    if (!job) return;

    this.isUpdating.set(true);

    this.adminService.updateJob(job.id, this.updateForm).subscribe({
      next: () => {
        this.isUpdating.set(false);
        this.closeUpdateModal();
        this.currentPage = 0;
        this.displayedJobs.set([]);
        this.hasMoreData.set(true);
        this.loadJobs();
      },
      error: (error) => {
        console.error('Error updating job:', error);
        alert('Failed to update job. Please try again.');
        this.isUpdating.set(false);
      }
    });
  }

  openDeleteModal(job: JobListItem): void {
    this.jobToDelete.set(job);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.jobToDelete.set(null);
  }

  confirmDelete(): void {
    const job = this.jobToDelete();
    if (!job) return;

    this.isDeleting.set(true);

    this.adminService.deleteJob(job.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        this.currentPage = 0;
        this.displayedJobs.set([]);
        this.hasMoreData.set(true);
        this.loadJobs();
      },
      error: (error) => {
        console.error('Error deleting job:', error);
        alert('Failed to delete job. Please try again.');
        this.isDeleting.set(false);
      }
    });
  }

  formatDate(dateString: string | null): string {
    if (!dateString || dateString === '0001-01-01' || dateString.startsWith('0001-01-01')) {
      return 'N/A';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  getStatusBadgeClass(status: string): string {
    if (!status) {
      return 'badge bg-secondary';
    }
    switch (status.toLowerCase()) {
      case 'active':
        return 'badge bg-success';
      case 'closed':
        return 'badge bg-secondary';
      case 'draft':
        return 'badge bg-warning';
      default:
        return 'badge bg-info';
    }
  }

  getExperienceBadgeClass(level: string): string {
    if (!level) {
      return 'badge bg-secondary';
    }
    switch (level.toLowerCase()) {
      case 'entrylevel':
        return 'badge bg-info';
      case 'junior':
        return 'badge bg-primary';
      case 'midlevel':
        return 'badge bg-warning';
      case 'senior':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }
}
