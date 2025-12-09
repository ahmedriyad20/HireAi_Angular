import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApplicantProfile, ApplicantSkill, UpdateApplicantProfileRequest } from '../../core/models/applicant-profile.model';
import { ApplicantProfileService } from '../../core/services/applicant-profile.service';
import { AuthService } from '../../core/services/auth.service';
import { FileUploadComponent } from '../../shared/components/file-upload.component';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, FileUploadComponent],
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css']
})
export class MyProfileComponent implements OnInit, OnDestroy {
  profile = signal<ApplicantProfile | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  isEditMode = signal(false);
  isSaving = signal(false);
  
  // Edit form data
  editForm = {
    fullName: '',
    email: '', // Hidden from UI but stored for API
    phone: '',
    dateOfBirth: '',
    title: '',
    bio: '',
    resumeUrl: '',
    skillLevel: '',
    address: ''
  };
  
  resumeFile: File | null = null;
  
  private destroy$ = new Subject<void>();
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor(private profileService: ApplicantProfileService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.error.set(null);
    
    const userId = this.authService.getUserId();
    if (!userId) {
      console.error('User ID not found');
      this.error.set('User not authenticated. Please login again.');
      this.loading.set(false);
      return;
    }
    
    const applicantId = parseInt(userId, 10);
    console.log('Loading profile for applicant ID:', applicantId);
    
    this.profileService
      .getApplicantProfile(applicantId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Profile loaded successfully:', data);
          console.log('Address value:', data.address);
          this.profile.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading profile:', err);
          
          // Handle 401 Unauthorized
          if (err.status === 401) {
            this.error.set('Session expired. Please login again.');
            this.authService.logout();
            this.router.navigate(['/applicant-login']);
            return;
          }
          
          // Handle 403 Forbidden
          if (err.status === 403) {
            this.error.set('You do not have permission to view this profile.');
            this.loading.set(false);
            return;
          }
          
          this.error.set(`Failed to load profile. Error: ${err.message || 'Unknown error'}`);
          this.loading.set(false);
        }
      });
  }

  enterEditMode(): void {
    if (!this.profile()) return;
    
    const currentProfile = this.profile()!;
    this.editForm = {
      fullName: currentProfile.name,
      email: currentProfile.email, // Store email for API but hide from UI
      phone: currentProfile.phone,
      dateOfBirth: currentProfile.dateOfBirth,
      title: currentProfile.title,
      bio: currentProfile.bio,
      resumeUrl: currentProfile.resumeUrl,
      skillLevel: currentProfile.skillLevel,
      address: currentProfile.address || ''
    };
    
    this.isEditMode.set(true);
  }

  cancelEdit(): void {
    this.isEditMode.set(false);
    this.error.set(null);
  }

  saveProfile(): void {
    if (!this.profile()) return;
    
    const userId = this.authService.getUserId();
    if (!userId) {
      this.error.set('User not authenticated. Please login again.');
      return;
    }
    
    const applicantId = parseInt(userId, 10);
    const currentProfile = this.profile()!;
    
    // Validate that we're updating the logged-in user's profile
    if (currentProfile.id !== applicantId) {
      this.error.set('You can only update your own profile.');
      return;
    }
    
    this.isSaving.set(true);
    this.error.set(null);
    
    // Check if a new CV file is uploaded
    if (this.resumeFile) {
      // Use FormData for file upload with PascalCase to match C# [FromForm] binding
      const formData = new FormData();
      
      // Format date for C# DateOnly (YYYY-MM-DD format only, no time)
      const dateOnly = this.editForm.dateOfBirth.split('T')[0]; // Remove time part if present
      
      // Use PascalCase property names to match C# ApplicantUpdateDto properties
      formData.append('Id', currentProfile.id.toString());
      formData.append('Email', this.editForm.email);
      formData.append('FullName', this.editForm.fullName);
      formData.append('Address', this.editForm.address || '');
      formData.append('Phone', this.editForm.phone);
      formData.append('DateOfBirth', dateOnly);
      formData.append('Title', this.editForm.title);
      formData.append('Bio', this.editForm.bio || '');
      formData.append('SkillLevel', this.editForm.skillLevel);
      formData.append('CvFile', this.resumeFile, this.resumeFile.name);
      
      // Debug logging - comprehensive
      console.log('=== FormData Debug Info ===');
      console.log('Applicant ID:', applicantId);
      console.log('Current Profile ID:', currentProfile.id);
      console.log('Edit Form Data:', this.editForm);
      console.log('FormData entries:');
      formData.forEach((value, key) => {
        console.log(`  ${key}: ${value instanceof File ? `[File: ${value.name}]` : value}`);
      });
      console.log('=========================');
      
      this.profileService
        .updateApplicantProfileWithFile(applicantId, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedProfile) => {
            console.log('Profile updated successfully with file:', updatedProfile);
            this.profile.set(updatedProfile);
            this.isEditMode.set(false);
            this.isSaving.set(false);
            this.resumeFile = null;
          },
          error: (err) => {
            this.handleUpdateError(err);
          }
        });
    } else {
      // Use regular JSON update without file
      const updateRequest: UpdateApplicantProfileRequest = {
        id: currentProfile.id,
        fullName: this.editForm.fullName,
        email: this.editForm.email,
        dateOfBirth: this.editForm.dateOfBirth,
        phone: this.editForm.phone,
        bio: this.editForm.bio,
        title: this.editForm.title,
        resumeUrl: this.editForm.resumeUrl,
        skillLevel: this.editForm.skillLevel,
        role: 'Applicant',
        isPremium: false,
        isActive: currentProfile.isActive,
        lastLogin: currentProfile.lastLogin,
        createdAt: currentProfile.createdAt,
        address: this.editForm.address,
        cvId: currentProfile.cvId,
        applicantSkills: currentProfile.applicantSkills
      };
      
      this.profileService
        .updateApplicantProfile(applicantId, updateRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedProfile) => {
            console.log('Profile updated successfully:', updatedProfile);
            this.profile.set(updatedProfile);
            this.isEditMode.set(false);
            this.isSaving.set(false);
          },
          error: (err) => {
            this.handleUpdateError(err);
          }
        });
    }
  }

  private handleUpdateError(err: any): void {
    console.error('Error updating profile:', err);
    console.error('Error details:', err.error);
    
    // Handle 401 Unauthorized
    if (err.status === 401) {
      this.error.set('Session expired. Please login again.');
      this.authService.logout();
      this.router.navigate(['/applicant-login']);
      return;
    }
    
    // Handle 403 Forbidden
    if (err.status === 403) {
      this.error.set('You do not have permission to update this profile.');
      this.isSaving.set(false);
      return;
    }
    
    // Handle 400 Bad Request with validation errors
    if (err.status === 400 && err.error?.errors) {
      const validationErrors = Object.entries(err.error.errors)
        .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
        .join('\n');
      this.error.set(`Validation errors:\n${validationErrors}`);
      console.error('Validation errors:', err.error.errors);
      this.isSaving.set(false);
      return;
    }
    
    this.error.set(`Failed to update profile. Error: ${err.error?.title || err.error?.message || err.message || 'Unknown error'}`);
    this.isSaving.set(false);
  }

  handleResumeFileSelect(file: File | null): void {
    this.resumeFile = file;
  }

  getSkillColor(rate: number): string {
    if (rate >= 80) return 'success';
    if (rate >= 60) return 'info';
    if (rate >= 40) return 'warning';
    return 'danger';
  }

  getAgeFromDateOfBirth(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getAverageProficiency(): number {
    if (!this.profile() || this.profile()!.applicantSkills.length === 0) return 0;
    const total = this.profile()!.applicantSkills.reduce((sum, s) => sum + s.skillRate, 0);
    return Math.round(total / this.profile()!.applicantSkills.length);
  }

  getExpertSkillsCount(): number {
    if (!this.profile()) return 0;
    return this.profile()!.applicantSkills.filter(s => s.skillRate >= 80).length;
  }

  getAdvancedSkillsCount(): number {
    if (!this.profile()) return 0;
    return this.profile()!.applicantSkills.filter(s => s.skillRate >= 60 && s.skillRate < 80).length;
  }

  downloadResume(): void {
    if (this.profile()?.resumeUrl) {
      window.open(this.profile()?.resumeUrl, '_blank');
    }
  }
}
