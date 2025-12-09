import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HrProfile, UpdateHrProfileRequest, AccountType } from '../../core/models/hr-profile.model';
import { HrProfileService } from '../../core/services/hr-profile.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-hr-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hr-profile.component.html',
  styleUrls: ['./hr-profile.component.css']
})
export class HrProfileComponent implements OnInit {
  profile = signal<HrProfile | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  isEditMode = signal(false);
  isSaving = signal(false);
  
  // Edit form data
  editForm = {
    fullName: '',
    address: '',
    phone: '',
    isPremium: false,
    bio: '',
    title: '',
    isActive: true,
    companyName: '',
    companyDescription: '',
    companyAddress: '',
    accountType: AccountType.Free,
    premiumExpiry: null as string | null
  };

  accountTypes = Object.values(AccountType);
  
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor(private profileService: HrProfileService) {}

  ngOnInit(): void {
    this.loadProfile();
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
    
    const hrId = parseInt(userId, 10);
    console.log('Loading profile for HR ID:', hrId);
    
    this.profileService.getHrProfile(hrId).subscribe({
      next: (data) => {
        console.log('HR Profile loaded successfully:', data);
        this.profile.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading HR profile:', err);
        
        if (err.status === 401) {
          this.error.set('Session expired. Please login again.');
          this.authService.logout();
          this.router.navigate(['/auth/login']);
          return;
        }
        
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getAccountBadgeClass(): string {
    return this.profile()?.isPremium ? 'badge-premium' : 'badge-free';
  }

  getStatusBadgeClass(): string {
    return this.profile()?.isActive ? 'badge-active' : 'badge-inactive';
  }

  enterEditMode(): void {
    if (!this.profile()) return;
    
    const currentProfile = this.profile()!;
    this.editForm = {
      fullName: currentProfile.fullName,
      address: currentProfile.address || '',
      phone: currentProfile.phone,
      isPremium: currentProfile.isPremium,
      bio: currentProfile.bio || '',
      title: currentProfile.title,
      isActive: currentProfile.isActive,
      companyName: currentProfile.companyName,
      companyDescription: currentProfile.companyDescription,
      companyAddress: currentProfile.companyAddress,
      accountType: currentProfile.accountType as AccountType,
      premiumExpiry: currentProfile.premiumExpiry
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
    
    const hrId = parseInt(userId, 10);
    const currentProfile = this.profile()!;
    
    // Validate that we're updating the logged-in user's profile
    if (currentProfile.id !== hrId) {
      this.error.set('You can only update your own profile.');
      return;
    }
    
    this.isSaving.set(true);
    this.error.set(null);
    
    const updateRequest: UpdateHrProfileRequest = {
      fullName: this.editForm.fullName,
      address: this.editForm.address,
      phone: this.editForm.phone,
      isPremium: this.editForm.isPremium,
      bio: this.editForm.bio,
      title: this.editForm.title,
      isActive: this.editForm.isActive,
      companyName: this.editForm.companyName,
      companyDescription: this.editForm.companyDescription,
      companyAddress: this.editForm.companyAddress,
      accountType: this.editForm.accountType,
      premiumExpiry: this.editForm.premiumExpiry
    };
    
    this.profileService.updateHrProfile(hrId, updateRequest).subscribe({
      next: (updatedProfile) => {
        console.log('Profile updated successfully:', updatedProfile);
        this.isSaving.set(false);
        this.isEditMode.set(false);
        this.error.set(null);
        // Reload the profile to ensure fresh data
        this.loadProfile();
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        this.isSaving.set(false);
        
        if (err.status === 401) {
          this.error.set('Session expired. Please login again.');
          this.authService.logout();
          this.router.navigate(['/auth/login']);
          return;
        }
        
        if (err.status === 403) {
          this.error.set('You do not have permission to update this profile.');
          return;
        }
        
        if (err.status === 400) {
          this.error.set(err.error?.message || 'Invalid data. Please check your input.');
          return;
        }
        
        this.error.set(`Failed to update profile. Error: ${err.message || 'Unknown error'}`);
      }
    });
  }
}
