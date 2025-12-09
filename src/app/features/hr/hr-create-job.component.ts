import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HRJobsService } from '../../core/services/hr-jobs.service';
import { AuthService } from '../../core/services/auth.service';
import { SkillsService } from '../../core/services/skills.service';
import { JobStatus, ExperienceLevel, EmploymentType, Skill } from '../../core/models/job.model';

@Component({
  selector: 'app-hr-create-job',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './hr-create-job.component.html',
  styleUrls: ['./hr-create-job.component.css']
})
export class HrCreateJobComponent implements OnInit {
  jobForm!: FormGroup;
  submitting = signal(false);
  error = signal<string | null>(null);
  showSuccessDialog = signal<boolean>(false);
  
  availableSkills = signal<Skill[]>([]);
  selectedSkills = signal<Skill[]>([]);
  loadingSkills = signal(true);
  
  // Search functionality
  skillSearchQuery = signal<string>('');
  filteredSkills = signal<Skill[]>([]);
  showSkillDropdown = signal<boolean>(false);

  // Enums for template
  JobStatus = JobStatus;
  ExperienceLevel = ExperienceLevel;
  EmploymentType = EmploymentType;

  // Enum values for iteration
  jobStatuses = Object.values(JobStatus);
  experienceLevels = Object.values(ExperienceLevel);
  employmentTypes = Object.values(EmploymentType);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private hrJobsService: HRJobsService,
    private authService: AuthService,
    private skillsService: SkillsService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadSkills();
  }

  initializeForm(): void {
    // Get minimum date (today)
    const today = new Date();
    const minDate = today.toISOString().slice(0, 16);

    this.jobForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      companyName: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      jobStatus: [JobStatus.NotSet, [Validators.required]],
      examDurationMinutes: [40, [Validators.required, Validators.min(10), Validators.max(120)]],
      experienceLevel: [ExperienceLevel.EntryLevel, [Validators.required]],
      employmentType: [EmploymentType.FullTime, [Validators.required]],
      location: ['', [Validators.required]],
      salaryRange: ['', [Validators.required]],
      isExamGeneratedByAi: [true],
      numberOfQuestions: [40, [Validators.required, Validators.min(1), Validators.max(100)]],
      applicationDeadline: ['', [Validators.required]],
      atsMinimumScore: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      autoSend: [true]
    });
  }

  loadSkills(): void {
    this.loadingSkills.set(true);
    this.skillsService.getAllSkills().subscribe({
      next: (skills) => {
        this.availableSkills.set(skills);
        this.filteredSkills.set(skills);
        this.loadingSkills.set(false);
      },
      error: (err) => {
        console.error('Error loading skills:', err);
        this.error.set('Failed to load skills. You can still create the job without skills.');
        this.loadingSkills.set(false);
      }
    });
  }

  onSkillSearchChange(query: string): void {
    this.skillSearchQuery.set(query);
    
    if (!query.trim()) {
      this.filteredSkills.set(this.availableSkills());
      this.showSkillDropdown.set(false);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = this.availableSkills().filter(skill => 
      skill.title.toLowerCase().includes(lowerQuery) ||
      skill.description.toLowerCase().includes(lowerQuery)
    );
    
    this.filteredSkills.set(filtered);
    this.showSkillDropdown.set(true);
  }

  onSkillSearchFocus(): void {
    if (this.skillSearchQuery().trim()) {
      this.showSkillDropdown.set(true);
    }
  }

  addSkill(skill: Skill): void {
    const currentSelected = this.selectedSkills();
    
    // Check if already selected
    if (currentSelected.some(s => s.id === skill.id)) {
      return;
    }
    
    // Add to selected skills
    this.selectedSkills.set([...currentSelected, skill]);
    
    // Clear search and hide dropdown
    this.skillSearchQuery.set('');
    this.filteredSkills.set(this.availableSkills());
    this.showSkillDropdown.set(false);
  }

  removeSkill(skillId: number): void {
    const currentSelected = this.selectedSkills();
    this.selectedSkills.set(currentSelected.filter(s => s.id !== skillId));
  }

  isSkillSelected(skillId: number): boolean {
    return this.selectedSkills().some(s => s.id === skillId);
  }

  closeSkillDropdown(): void {
    // Delay to allow click events to fire
    setTimeout(() => {
      this.showSkillDropdown.set(false);
    }, 200);
  }

  onSubmit(): void {
    if (this.jobForm.invalid) {
      Object.keys(this.jobForm.controls).forEach(key => {
        this.jobForm.get(key)?.markAsTouched();
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
    
    // Format the deadline to ISO string
    const deadline = formValue.applicationDeadline 
      ? new Date(formValue.applicationDeadline).toISOString()
      : new Date().toISOString();

    // Build the request body matching the API structure
    const jobData: any = {
      title: formValue.title,
      companyName: formValue.companyName,
      description: formValue.description,
      jobStatus: formValue.jobStatus,
      examDurationMinutes: formValue.examDurationMinutes,
      experienceLevel: formValue.experienceLevel,
      employmentType: formValue.employmentType,
      location: formValue.location,
      salaryRange: formValue.salaryRange,
      isExamGeneratedByAi: formValue.isExamGeneratedByAi ? 'True' : 'False', // Convert to string
      numberOfQuestions: formValue.numberOfQuestions,
      applicationDeadline: deadline,
      atsMinimumScore: formValue.atsMinimumScore,
      autoSend: formValue.autoSend,
      hrId: parseInt(userId, 10),
      skillIds: this.selectedSkills().map(skill => skill.id)
    };

    this.hrJobsService.createJob(jobData).subscribe({
      next: (createdJob) => {
        this.submitting.set(false);
        this.showSuccessDialog.set(true);
        
        // Navigate to the created job details page after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/hr/jobs', createdJob.id]);
        }, 2000);
      },
      error: (err) => {
        console.error('Error creating job:', err);
        let errorMessage = 'Failed to create job. ';
        
        if (err.error?.message) {
          errorMessage += err.error.message;
        } else if (err.error?.errors) {
          const errors = Object.values(err.error.errors).flat();
          errorMessage += errors.join(', ');
        } else if (err.message) {
          errorMessage += err.message;
        } else {
          errorMessage += 'Please check your input and try again.';
        }
        
        this.error.set(errorMessage);
        this.submitting.set(false);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/hr/jobs']);
  }

  closeSuccessDialog(): void {
    this.showSuccessDialog.set(false);
    this.router.navigate(['/hr/jobs']);
  }

  // Validation helper methods
  isFieldInvalid(fieldName: string): boolean {
    const field = this.jobForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.jobForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${this.formatFieldName(fieldName)} is required`;
      if (field.errors['minlength']) return `Minimum length is ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;
      if (field.errors['max']) return `Maximum value is ${field.errors['max'].max}`;
    }
    return '';
  }

  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}
