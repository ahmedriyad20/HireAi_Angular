import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HRRegistration, AccountType } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-hr-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './hr-register.component.html',
  styleUrls: ['./hr-register.component.css']
})
export class HrRegisterComponent {
  formData: HRRegistration = {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    hrAddress: '',
    dateOfBirth: '',
    companyName: '',
    companyAddress: '',
    companyDescription: '',
    jobTitle: '',
    accountType: AccountType.Free
  };
  
  acceptTerms = false;
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  loading = signal(false);
  error = signal<string>('');

  private router = inject(Router);
  private authService = inject(AuthService);

  validateForm(): boolean {
    if (!this.formData.fullName || !this.formData.email || !this.formData.password || !this.formData.companyName) {
      this.error.set('Please fill in all required fields');
      return false;
    }

    if (!this.formData.phone || !this.formData.hrAddress || !this.formData.dateOfBirth || 
        !this.formData.companyAddress || !this.formData.jobTitle) {
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

    return true;
  }

  handleRegister() {
    if (!this.validateForm()) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

    // Prepare the request data
    const requestData = {
      email: this.formData.email,
      password: this.formData.password,
      confirmPassword: this.formData.confirmPassword,
      fullName: this.formData.fullName,
      hrAddress: this.formData.hrAddress,
      phone: this.formData.phone,
      dateOfBirth: this.formData.dateOfBirth,
      companyName: this.formData.companyName,
      companyAddress: this.formData.companyAddress,
      companyDescription: this.formData.companyDescription || '',
      jobTitle: this.formData.jobTitle,
      accountType: this.formData.accountType
    };

    this.authService.registerHR(requestData).subscribe({
      next: (response) => {
        console.log('HR Registration successful:', response);
        this.loading.set(false);
        
        // Show success message
        alert(response.message || 'Registration successful!');
        
        // Navigate to login
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('HR Registration error:', error);
        this.loading.set(false);
        this.error.set(error.message || 'Registration failed. Please try again.');
      }
    });
  }
}
