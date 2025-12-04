import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApplicantProfile, ApplicantSkill } from '../../core/models/applicant-profile.model';
import { ApplicantProfileService } from '../../core/services/applicant-profile.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css']
})
export class MyProfileComponent implements OnInit, OnDestroy {
  profile = signal<ApplicantProfile | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  private destroy$ = new Subject<void>();

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
    console.log('Loading profile for applicant ID: 2');
    
    this.profileService
      .getApplicantProfile(2)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Profile loaded successfully:', data);
          this.profile.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading profile:', err);
          this.error.set(`Failed to load profile. Error: ${err.message || 'Unknown error'}`);
          this.loading.set(false);
        }
      });
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
