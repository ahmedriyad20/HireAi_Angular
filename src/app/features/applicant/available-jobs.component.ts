import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobOpening, JobFilters, JobStatus, ExperienceLevel, EmploymentType } from '../../core/models/job.model';
import { AvailableJobsService, JobResponse } from '../../core/services/available-jobs.service';

@Component({
  selector: 'app-available-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './available-jobs.component.html',
  styleUrls: ['./available-jobs.component.css']
})
export class AvailableJobsComponent implements OnInit {
  allJobs = signal<JobOpening[]>([]);
  filters = signal<JobFilters>({});
  loading = signal(false);
  viewMode = signal<'grid' | 'list'>('grid');
  
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

  private readonly router = inject(Router);
  private readonly jobsService = inject(AvailableJobsService);

  ngOnInit() {
    this.loadJobs();
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
        const jobs: JobOpening[] = response.map((job, index) => ({
          id: index + 1,
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
          atsMinimumScore: job.atsMinimumScore
        }));
        
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
    }
    
    // Reset to first page when filters change
    this.currentPage.set(1);
  }

  clearFilters() {
    this.filters.set({});
    this.selectedExperienceLabel.set('All Levels');
    this.selectedEmploymentLabel.set('All Types');
    this.selectedLocationLabel.set('All Locations');
  }

  viewJobDetails(jobId: number | undefined) {
    if (jobId) {
      this.router.navigate(['/applicant/jobs', jobId]);
    }
  }

  applyForJob(jobId: number | undefined, event: Event) {
    event.stopPropagation();
    if (jobId) {
      this.router.navigate(['/applicant/jobs', jobId, 'apply']);
    }
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days left`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  isDeadlineNear(deadline?: Date): boolean {
    if (!deadline) return false;
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
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
