import { Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AccountSettingsService } from '../../core/services/account-settings.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account-settings.component.html',
  styleUrls: ['./account-settings.component.css']
})
export class AccountSettingsComponent implements OnDestroy {
  private accountSettingsService = inject(AccountSettingsService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // Get user role for redirects
  private userRole = this.authService.getUserRole()?.toLowerCase() || 'applicant';

  // Active tab
  activeTab = signal<'password' | 'email' | 'delete'>('password');

  // Loading states
  loadingPassword = signal(false);
  loadingEmail = signal(false);
  loadingDelete = signal(false);

  // Error and success messages
  passwordError = signal<string | null>(null);
  emailError = signal<string | null>(null);
  deleteError = signal<string | null>(null);
  passwordSuccess = signal<string | null>(null);
  emailSuccess = signal<string | null>(null);

  // Form data
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  };

  emailForm = {
    newEmail: '',
    confirmNewEmail: ''
  };

  deleteForm = {
    password: '',
    confirmText: ''
  };

  // Show delete confirmation
  showDeleteConfirmation = signal(false);

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveTab(tab: 'password' | 'email' | 'delete'): void {
    this.activeTab.set(tab);
    this.clearMessages();
  }

  clearMessages(): void {
    this.passwordError.set(null);
    this.emailError.set(null);
    this.deleteError.set(null);
    this.passwordSuccess.set(null);
    this.emailSuccess.set(null);
  }

  // Change Password
  validatePasswordForm(): boolean {
    if (!this.passwordForm.currentPassword || !this.passwordForm.newPassword || !this.passwordForm.confirmNewPassword) {
      this.passwordError.set('All fields are required');
      return false;
    }

    if (this.passwordForm.newPassword.length < 4) {
      this.passwordError.set('New password must be at least 4 characters long');
      return false;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmNewPassword) {
      this.passwordError.set('New passwords do not match');
      return false;
    }

    if (this.passwordForm.currentPassword === this.passwordForm.newPassword) {
      this.passwordError.set('New password must be different from current password');
      return false;
    }

    return true;
  }

  onChangePassword(): void {
    this.passwordError.set(null);
    this.passwordSuccess.set(null);

    if (!this.validatePasswordForm()) {
      return;
    }

    this.loadingPassword.set(true);

    this.accountSettingsService.changePassword({
      currentPassword: this.passwordForm.currentPassword,
      newPassword: this.passwordForm.newPassword,
      confirmNewPassword: this.passwordForm.confirmNewPassword
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadingPassword.set(false);
          this.passwordSuccess.set(response.message || 'Password changed successfully');
          
          // Clear form
          this.passwordForm = {
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: ''
          };

          // Logout and redirect after 2 seconds
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/auth/login'], { 
              queryParams: { message: 'Password changed successfully. Please login with your new password.' }
            });
          }, 2000);
        },
        error: (error) => {
          this.loadingPassword.set(false);
          this.passwordError.set(error);
        }
      });
  }

  // Change Email
  validateEmailForm(): boolean {
    if (!this.emailForm.newEmail || !this.emailForm.confirmNewEmail) {
      this.emailError.set('All fields are required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.emailForm.newEmail)) {
      this.emailError.set('Please enter a valid email address');
      return false;
    }

    if (this.emailForm.newEmail !== this.emailForm.confirmNewEmail) {
      this.emailError.set('Email addresses do not match');
      return false;
    }

    return true;
  }

  onChangeEmail(): void {
    this.emailError.set(null);
    this.emailSuccess.set(null);

    if (!this.validateEmailForm()) {
      return;
    }

    this.loadingEmail.set(true);

    this.accountSettingsService.changeEmail({
      newEmail: this.emailForm.newEmail,
      confirmNewEmail: this.emailForm.confirmNewEmail
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadingEmail.set(false);
          this.emailSuccess.set(response.message || 'Email changed successfully');
          
          // Clear form
          this.emailForm = {
            newEmail: '',
            confirmNewEmail: ''
          };

          // Optionally update stored email or logout
          setTimeout(() => {
            this.emailSuccess.set(null);
          }, 5000);
        },
        error: (error) => {
          this.loadingEmail.set(false);
          this.emailError.set(error);
        }
      });
  }

  // Delete Account
  openDeleteConfirmation(): void {
    this.deleteError.set(null); // Clear any previous errors
    if (!this.deleteForm.password) {
      this.deleteError.set('Password is required');
      return;
    }
    this.showDeleteConfirmation.set(true);
  }

  closeDeleteConfirmation(): void {
    this.showDeleteConfirmation.set(false);
    this.deleteForm.confirmText = '';
    this.deleteError.set(null); // Clear error when closing
  }

  validateDeleteForm(): boolean {
    if (!this.deleteForm.password) {
      this.deleteError.set('Password is required');
      return false;
    }

    if (this.deleteForm.confirmText !== 'DELETE') {
      this.deleteError.set('Please type DELETE to confirm account deletion');
      return false;
    }

    return true;
  }

  onDeleteAccount(): void {
    this.deleteError.set(null);

    if (!this.validateDeleteForm()) {
      return;
    }

    this.loadingDelete.set(true);

    console.log('Attempting to delete account with password:', this.deleteForm.password ? '***' : 'empty');

    this.accountSettingsService.deleteAccount({
      password: this.deleteForm.password
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Delete account success:', response);
          this.loadingDelete.set(false);
          
          // Logout and redirect
          this.authService.logout();
          this.router.navigate(['/auth/login'], { 
            queryParams: { message: response.message || 'Account deleted successfully.' }
          });
        },
        error: (error) => {
          console.error('Delete account error:', error);
          this.loadingDelete.set(false);
          this.deleteError.set(typeof error === 'string' ? error : 'Failed to delete account. Please check your password.');
          // Keep modal open to show error
        }
      });
  }
}
