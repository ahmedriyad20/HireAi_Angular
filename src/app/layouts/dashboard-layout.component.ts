import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent, MenuItem } from '../shared/components/sidebar.component';
import { HeaderComponent, User } from '../shared/components/header.component';

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
    name: 'John Doe',
    email: 'john@example.com',
    role: 'HR Manager'
  });

  menuSections = signal<{ title: string; items: MenuItem[] }[]>([]);

  constructor(private router: Router) {}

  ngOnInit() {
    // Determine user role based on current route
    const isApplicant = this.router.url.includes('/applicant');
    
    if (isApplicant) {
      this.user.set({
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        role: 'Applicant'
      });
      
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
            { label: 'Settings', icon: 'gear', route: '/applicant/settings' },
          ]
        }
      ]);
    } else {
      this.user.set({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'HR Manager'
      });
      
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
            { label: 'Settings', icon: 'gear', route: '/hr/settings' },
            { label: 'Billing', icon: 'credit-card', route: '/hr/billing' },
          ]
        }
      ]);
    }
  }

  handleLogout() {
    console.log('Logout clicked');
    this.router.navigate(['/']);
  }
}
