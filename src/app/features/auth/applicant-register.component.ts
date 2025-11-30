import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FileUploadComponent } from '../../shared/components/file-upload.component';
import { ApplicantRegistration, SkillLevel } from '../../core/models/user.model';

@Component({
  selector: 'app-applicant-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, FileUploadComponent],
  templateUrl: './applicant-register.component.html',
  styleUrls: ['./applicant-register.component.css']
})
export class ApplicantRegisterComponent {
  formData: ApplicantRegistration = {
    name: '',
    email: '',
    password: '',
    phone: '',
    title: '',
    skillLevel: SkillLevel.Beginner
  };
  
  confirmPassword = '';
  acceptTerms = false;
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  loading = signal(false);
  error = signal<string>('');
  
  skillLevels = Object.values(SkillLevel);

  constructor(private router: Router) {}

  handleFileSelect(file: File | null) {
    if (file) {
      this.formData.resumeFile = file;
    }
  }

  validateForm(): boolean {
    if (!this.formData.name || !this.formData.email || !this.formData.password) {
      this.error.set('Please fill in all required fields');
      return false;
    }

    if (this.formData.password.length < 8) {
      this.error.set('Password must be at least 8 characters long');
      return false;
    }

    if (this.formData.password !== this.confirmPassword) {
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

    return true;
  }

  handleRegister() {
    if (!this.validateForm()) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

    // Simulate API call
    setTimeout(() => {
      console.log('Registration attempt:', this.formData);
      this.loading.set(false);
      // Navigate to login on success
      this.router.navigate(['/auth/applicant-login']);
    }, 1500);
  }
}
