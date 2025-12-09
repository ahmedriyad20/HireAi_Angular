import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { JobDetailsService, JobDetailsResponse } from '../../core/services/job-details.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-job-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './job-details.component.html',
  styleUrls: ['./job-details.component.css']
})
export class JobDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly jobDetailsService = inject(JobDetailsService);

  jobDetails = signal<JobDetailsResponse | null>(null);
  totalApplications = signal<number>(0);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  jobId = signal<number>(0);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['jobId'];
      if (id) {
        this.jobId.set(+id);
        this.loadJobDetails(+id);
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

  applyForJob(): void {
    // TODO: Implement apply for job logic
    console.log('Applying for job:', this.jobId());
    alert('Apply for job functionality will be implemented. Job ID: ' + this.jobId());
  }
}
