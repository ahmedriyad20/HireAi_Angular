import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FileUploadComponent } from '../../shared/components/file-upload.component';
import { ApplicantRegistration, SkillLevel } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-applicant-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, FileUploadComponent],
  templateUrl: './applicant-register.component.html',
  styleUrls: ['./applicant-register.component.css']
})
export class ApplicantRegisterComponent {
  formData: ApplicantRegistration = {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    title: '',
    resumeUrl: '',
    skillLevel: SkillLevel.Beginner
  };
  
  acceptTerms = false;
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  loading = signal(false);
  error = signal<string>('');
  
  skillLevels = Object.values(SkillLevel);

  private router = inject(Router);
  private authService = inject(AuthService);

  handleFileSelect(file: File | null) {
    if (file) {
      this.formData.resumeFile = file;
      this.formData.resumeUrl = file.name;
    }
  }

  validateForm(): boolean {
    if (!this.formData.fullName || !this.formData.email || !this.formData.password) {
      this.error.set('Please fill in all required fields');
      return false;
    }

    if (!this.formData.phone || !this.formData.address || !this.formData.dateOfBirth || !this.formData.title) {
      this.error.set('Please fill in all required fields');
      return false;
    }

    if (this.formData.password.length < 8) {
      this.error.set('Password must be at least 8 characters long');
      return false;
    }

    if (this.formData.password !== this.formData.confirmPassword) {
      this.error.set('Passwords do not match');
      return false;
    }

    if (!this.acceptTerms) {
      this.error.set('Please accept the terms and conditions');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.formData.email)) {
      this.error.set('Please enter a valid email address');
      return false;
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(this.formData.phone.replace(/[\s()-]/g, ''))) {
      this.error.set('Please enter a valid phone number');
      return false;
    }

    if (!this.formData.resumeFile) {
      this.error.set('Please upload your resume (PDF file)');
      return false;
    }

    return true;
  }

  handleRegister() {
    if (!this.validateForm()) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

    // Prepare FormData for file upload
    const formData = new FormData();
    formData.append('email', this.formData.email);
    formData.append('password', this.formData.password);
    formData.append('confirmPassword', this.formData.confirmPassword);
    formData.append('fullName', this.formData.fullName);
    formData.append('address', this.formData.address);
    formData.append('phone', this.formData.phone);
    formData.append('dateOfBirth', this.formData.dateOfBirth);
    formData.append('title', this.formData.title);
    formData.append('skillLevel', this.formData.skillLevel);
    
    // Append the CV file
    if (this.formData.resumeFile) {
      formData.append('cvFile', this.formData.resumeFile, this.formData.resumeFile.name);
    }

    this.authService.registerApplicant(formData).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.loading.set(false);
        
        // Show success message
        alert(response.message || 'Registration successful!');
        
        // Navigate to login
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Registration error:', error);
        this.loading.set(false);
        this.error.set(error.message || 'Registration failed. Please try again.');
      }
    });
  }
}
