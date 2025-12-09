import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HRJobsService } from '../../core/services/hr-jobs.service';
import { AuthService } from '../../core/services/auth.service';
import { JobOpening, JobStatus, ExperienceLevel, EmploymentType } from '../../core/models/job.model';

@Component({
  selector: 'app-hr-update-job',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './hr-update-job.component.html',
  styleUrls: ['./hr-update-job.component.css']
})
export class HrUpdateJobComponent implements OnInit {
  jobForm!: FormGroup;
  loading = signal(true);
  submitting = signal(false);
  error = signal<string | null>(null);
  jobId: number | null = null;
  
  // Success dialog
  showSuccessDialog = signal<boolean>(false);

  // Enum values for dropdowns
  jobStatuses = Object.values(JobStatus);
  experienceLevels = Object.values(ExperienceLevel);
  employmentTypes = Object.values(EmploymentType);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private hrJobsService: HRJobsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    
    const jobIdParam = this.route.snapshot.paramMap.get('jobId');
    if (jobIdParam) {
      this.jobId = +jobIdParam;
      this.loadJobData(this.jobId);
    } else {
      this.error.set('Invalid job ID');
      this.loading.set(false);
    }
  }

  initializeForm(): void {
    this.jobForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      companyName: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      jobStatus: [JobStatus.NotSet, [Validators.required]],
      examDurationMinutes: [40, [Validators.required, Validators.min(10), Validators.max(40)]],
      experienceLevel: [ExperienceLevel.EntryLevel, [Validators.required]],
      employmentType: [EmploymentType.FullTime, [Validators.required]],
      location: ['', [Validators.required]],
      salaryRange: ['', [Validators.required]],
      numberOfQuestions: [40, [Validators.required, Validators.min(1)]],
      applicationDeadline: ['', [Validators.required]],
      atsMinimumScore: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      autoSend: [true]
    });
  }

  loadJobData(jobId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.hrJobsService.getJobById(jobId).subscribe({
      next: (job) => {
        // Format the date for the input field
        const formattedDeadline = job.applicationDeadline 
          ? new Date(job.applicationDeadline).toISOString().slice(0, 16)
          : '';

        this.jobForm.patchValue({
          title: job.title,
          companyName: job.companyName,
          description: job.description || '',
          jobStatus: job.jobStatus,
          examDurationMinutes: job.examDurationMinutes || 40,
          experienceLevel: job.experienceLevel || ExperienceLevel.EntryLevel,
          employmentType: job.employmentType || EmploymentType.FullTime,
          location: job.location || '',
          salaryRange: job.salaryRange || '',
          numberOfQuestions: job.numberOfQuestions || 40,
          applicationDeadline: formattedDeadline,
          atsMinimumScore: job.atsMinimumScore || 0,
          autoSend: job.autoSend !== undefined ? job.autoSend : true
        });

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading job:', err);
        
        let errorMessage = 'Failed to load job details. ';
        if (err.status === 0) {
          errorMessage += 'Cannot connect to server.';
        } else if (err.status === 404) {
          errorMessage += 'Job not found.';
        } else if (err.status === 401) {
          errorMessage += 'Please login again.';
        } else {
          errorMessage += 'Please try again later.';
        }
        
        this.error.set(errorMessage);
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.jobForm.invalid || !this.jobId) {
      Object.keys(this.jobForm.controls).forEach(key => {
        const control = this.jobForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const userId = this.authService.getUserId();
    if (!userId) {
      this.error.set('User not authenticated. Please login again.');
      this.submitting.set(false);
      return;
    }

    const formValue = this.jobForm.value;
    
    // Format the date to ISO string
    const deadline = formValue.applicationDeadline 
      ? new Date(formValue.applicationDeadline).toISOString()
      : new Date().toISOString();

    const jobData: any = {
      ...formValue,
      applicationDeadline: deadline,
      hrId: parseInt(userId, 10)
    };

    console.log('Sending job data:', jobData);
    
    this.hrJobsService.updateJob(this.jobId, jobData).subscribe({
      next: () => {
        this.submitting.set(false);
        this.showSuccessDialog.set(true);
        
        // Navigate after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/hr/jobs', this.jobId]);
        }, 2000);
      },
      error: (err) => {
        console.error('Error updating job:', err);
        console.error('Validation errors:', err.error?.errors);
        
        let errorMessage = 'Failed to update job. ';
        if (err.status === 0) {
          errorMessage += 'Cannot connect to server.';
        } else if (err.status === 400) {
          errorMessage += 'Invalid data provided.';
          if (err.error?.errors) {
            const validationErrors = Object.entries(err.error.errors)
              .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('; ');
            errorMessage += ` (${validationErrors})`;
          }
        } else if (err.status === 401) {
          errorMessage += 'Please login again.';
        } else if (err.status === 403) {
          errorMessage += 'You do not have permission to update this job.';
        } else {
          errorMessage += 'Please try again later.';
        }
        
        this.error.set(errorMessage);
        this.submitting.set(false);
      }
    });
  }

  cancel(): void {
    if (this.jobId) {
      this.router.navigate(['/hr/jobs', this.jobId]);
    } else {
      this.router.navigate(['/hr/jobs']);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.jobForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.jobForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `Minimum length is ${field.errors['minlength'].requiredLength}`;
      if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;
      if (field.errors['max']) return `Maximum value is ${field.errors['max'].max}`;
    }
    return '';
  }

  closeSuccessDialog(): void {
    this.showSuccessDialog.set(false);
    if (this.jobId) {
      this.router.navigate(['/hr/jobs', this.jobId]);
    }
  }
}
