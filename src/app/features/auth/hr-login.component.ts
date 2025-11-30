import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-hr-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './hr-login.component.html',
  styleUrls: ['./hr-login.component.css']
})
export class HrLoginComponent {
  credentials = {
    email: '',
    password: ''
  };
  rememberMe = false;
  showPassword = signal(false);
  loading = signal(false);
  error = signal<string>('');

  constructor(private router: Router) {}

  handleLogin() {
    this.loading.set(true);
    this.error.set('');

    // Simulate API call
    setTimeout(() => {
      console.log('Login attempt:', this.credentials);
      this.loading.set(false);
      // Navigate to dashboard on success
      this.router.navigate(['/hr/dashboard']);
    }, 1500);
  }
}
