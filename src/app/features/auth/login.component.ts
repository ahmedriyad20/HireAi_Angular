import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  credentials = {
    email: '',
    password: ''
  };
  
  rememberMe = false;
  showPassword = signal(false);
  loading = signal(false);
  error = signal<string>('');
  successMessage = signal<string>('');

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  ngOnInit(): void {
    // Check for success message from query params (e.g., after password change)
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.successMessage.set(params['message']);
        // Clear the message after 10 seconds
        setTimeout(() => this.successMessage.set(''), 10000);
      }
    });
  }

  validateForm(): boolean {
    if (!this.credentials.email || !this.credentials.password) {
      this.error.set('Please enter both email and password');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.credentials.email)) {
      this.error.set('Please enter a valid email address');
      return false;
    }

    if (this.credentials.password.length < 4) {
      this.error.set('Password must be at least 4 characters long');
      return false;
    }

    return true;
  }

  handleLogin() {
    if (!this.validateForm()) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.login(this.credentials.email, this.credentials.password, this.rememberMe).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        this.loading.set(false);

        // Navigate based on user role
        const userRole = response.userRole?.toLowerCase();
        
        if (userRole === 'applicant') {
          this.router.navigate(['/applicant/dashboard']);
        } else if (userRole === 'hr') {
          this.router.navigate(['/hr/dashboard']);
        } else {
          this.error.set('Unknown user role. Please contact support.');
        }
      },
      error: (error) => {
        console.error('Login error:', error);
        this.loading.set(false);
        this.error.set(error.message || 'Login failed. Please check your credentials and try again.');
      }
    });
  }
}
