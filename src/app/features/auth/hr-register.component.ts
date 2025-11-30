import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HRRegistration } from '../../core/models/user.model';

@Component({
  selector: 'app-hr-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './hr-register.component.html',
  styleUrls: ['./hr-register.component.css']
})
export class HrRegisterComponent {
  formData: HRRegistration = {
    name: '',
    email: '',
    password: '',
    phone: '',
    companyName: '',
    title: '',
    bio: ''
  };
  
  confirmPassword = '';
  acceptTerms = false;
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  loading = signal(false);
  error = signal<string>('');

  constructor(private router: Router) {}

  validateForm(): boolean {
    if (!this.formData.name || !this.formData.email || !this.formData.password || !this.formData.companyName) {
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
      console.log('HR Registration attempt:', this.formData);
      this.loading.set(false);
      // Navigate to login on success
      this.router.navigate(['/auth/hr-login']);
    }, 1500);
  }
}
