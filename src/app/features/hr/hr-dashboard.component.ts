import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StatCardComponent, StatCardData } from '../../shared/components/stat-card.component';
import { StatusTagComponent } from '../../shared/components/status-tag.component';

@Component({
  selector: 'app-hr-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatCardComponent, StatusTagComponent],
  templateUrl: './hr-dashboard.component.html',
  styleUrls: ['./hr-dashboard.component.css']
})
export class HrDashboardComponent {
  statsData = signal<StatCardData[]>([
    {
      label: 'Total Applicants',
      value: '1,234',
      icon: 'people',
      iconColor: 'primary',
      trend: { value: 12, direction: 'up' }
    },
    {
      label: 'ATS Pass Rate',
      value: '68%',
      icon: 'check-circle',
      iconColor: 'success',
      trend: { value: 8, direction: 'up' }
    },
    {
      label: 'Exams Taken',
      value: '856',
      icon: 'clipboard-check',
      iconColor: 'indigo',
      trend: { value: 5, direction: 'down' }
    },
    {
      label: 'Top Candidates',
      value: '124',
      icon: 'star',
      iconColor: 'warning',
      trend: { value: 15, direction: 'up' }
    }
  ]);

  recentApplicants = signal([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      position: 'Senior Software Engineer',
      appliedDate: '2025-11-25',
      atsScore: 85,
      examScore: 92,
      status: 'passed' as const
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      position: 'Frontend Developer',
      appliedDate: '2025-11-24',
      atsScore: 78,
      examScore: 88,
      status: 'passed' as const
    },
    {
      id: 3,
      name: 'Michael Chen',
      email: 'michael@example.com',
      position: 'Full Stack Developer',
      appliedDate: '2025-11-23',
      atsScore: 72,
      examScore: null,
      status: 'pending' as const
    },
    {
      id: 4,
      name: 'Emily Rodriguez',
      email: 'emily@example.com',
      position: 'UX Designer',
      appliedDate: '2025-11-22',
      atsScore: 65,
      examScore: 75,
      status: 'in-progress' as const
    },
    {
      id: 5,
      name: 'David Kim',
      email: 'david@example.com',
      position: 'Backend Developer',
      appliedDate: '2025-11-21',
      atsScore: 45,
      examScore: null,
      status: 'failed' as const
    }
  ]);

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
