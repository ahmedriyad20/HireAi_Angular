import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent, MenuItem } from '../shared/components/sidebar.component';
import { HeaderComponent, User } from '../shared/components/header.component';
import { AuthService } from '../core/services/auth.service';
import { ApplicantProfileService } from '../core/services/applicant-profile.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.css']
})
export class DashboardLayoutComponent implements OnInit {
  sidebarCollapsed = signal(false);
  notificationCount = signal(3);
  
  user = signal<User>({
    name: 'Loading...',
    email: '',
    role: ''
  });

  menuSections = signal<{ title: string; items: MenuItem[] }[]>([]);
  private authService = inject(AuthService);
  private profileService = inject(ApplicantProfileService);

  constructor(private router: Router) {}

  ngOnInit() {
    // Determine user role based on current route
    const isApplicant = this.router.url.includes('/applicant');
    const userRole = this.authService.getUserRole();
    const userId = this.authService.getUserId();
    
    if (isApplicant) {
      // Set menu items for applicant
      this.menuSections.set([
        {
          title: 'Main',
          items: [
            { label: 'Dashboard', icon: 'speedometer2', route: '/applicant/dashboard' },
            { label: 'Explore Jobs', icon: 'search', route: '/applicant/jobs' },
            { label: 'My Applications', icon: 'briefcase', route: '/applicant/applications' },
            { label: 'Mock Exams', icon: 'trophy', route: '/applicant/mock-exams' },
          ]
        },
        {
          title: 'Account',
          items: [
            { label: 'My Profile', icon: 'person-circle', route: '/applicant/profile' },
            { label: 'Account Settings', icon: 'gear', route: '/applicant/settings' },
          ]
        }
      ]);

      // Fetch applicant profile data
      if (userId) {
        this.profileService.getApplicantProfile(parseInt(userId, 10)).subscribe({
          next: (profile) => {
            this.user.set({
              name: profile.name || 'User',
              email: profile.email || '',
              role: 'Applicant'
            });
          },
          error: (error) => {
            console.error('Error loading user profile:', error);
            this.user.set({
              name: 'Applicant',
              email: '',
              role: 'Applicant'
            });
          }
        });
      } else {
        this.user.set({
          name: 'Applicant',
          email: '',
          role: 'Applicant'
        });
      }
    } else {
      // Set menu items for HR
      this.menuSections.set([
        {
          title: 'Main',
          items: [
            { label: 'Dashboard', icon: 'speedometer2', route: '/hr/dashboard' },
            { label: 'Jobs', icon: 'briefcase', route: '/hr/jobs' },
            { label: 'Applicants', icon: 'people', route: '/hr/applicants' },
          ]
        },
        {
          title: 'Tools',
          items: [
            { label: 'Create Job', icon: 'plus-circle', route: '/hr/jobs/create' },
            { label: 'Analytics', icon: 'bar-chart', route: '/hr/analytics' },
            { label: 'Reports', icon: 'file-text', route: '/hr/reports' },
          ]
        },
        {
          title: 'Account',
          items: [
            { label: 'Account Settings', icon: 'gear', route: '/hr/settings' },
            { label: 'Billing', icon: 'credit-card', route: '/hr/billing' },
          ]
        }
      ]);

      // For HR users, we'll use default for now (can be extended later with HR profile service)
      this.user.set({
        name: 'HR Manager',
        email: '',
        role: 'HR Manager'
      });
    }
  }

  handleLogout() {
    console.log('Logout clicked');
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
