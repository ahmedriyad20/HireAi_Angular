import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent, StatCardData } from '../../shared/components/stat-card.component';
import { StatusTagComponent } from '../../shared/components/status-tag.component';
import { SkillImprovementChartComponent, SkillProgressData } from '../../shared/components/skill-improvement-chart.component';
import { ApplicantDashboardService } from '../../core/services/applicant-dashboard.service';
import { ApplicantDashboardData } from '../../core/models/dashboard.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-applicant-dashboard',
  standalone: true,
  imports: [CommonModule, StatCardComponent, StatusTagComponent, SkillImprovementChartComponent],
  templateUrl: './applicant-dashboard.component.html',
  styleUrls: ['./applicant-dashboard.component.css']
})
export class ApplicantDashboardComponent implements OnInit {
  private dashboardService = inject(ApplicantDashboardService);
  private authService = inject(AuthService);
  
  dashboardData = signal<ApplicantDashboardData | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  statsData = signal<StatCardData[]>([
    {
      label: 'Active Applications',
      value: '0',
      icon: 'briefcase',
      iconColor: 'primary'
    },
    {
      label: 'Mock Exams Taken',
      value: '0',
      icon: 'clock-history',
      iconColor: 'warning'
    },
    {
      label: 'Average Score',
      value: '0%',
      icon: 'check-circle',
      iconColor: 'success'
    },
    {
      label: 'Skill Level',
      value: 'Beginner',
      icon: 'star',
      iconColor: 'indigo'
    }
  ]);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    this.error.set(null);
    const userId = this.authService.getUserId();
    if (!userId) {
      console.error('User ID not found');
      this.error.set('User not authenticated. Please login again.');
      this.isLoading.set(false);
      return;
    }
    const applicantId = parseInt(userId, 10);
    
    this.dashboardService.getDashboardData(applicantId).subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.updateStatsData(data);
        this.updateTimelineFromData(data);
        this.updateSkillsFromData(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        if (error.status === 403) {
          this.error.set('Access denied. You do not have permission to view this dashboard.');
        } else if (error.status === 401) {
          this.error.set('Your session has expired. Please login again.');
        } else {
          this.error.set('Failed to load dashboard data. Please try again later.');
        }
        this.isLoading.set(false);
      }
    });
  }

  private updateStatsData(data: ApplicantDashboardData): void {
    this.statsData.set([
      {
        label: 'Active Applications',
        value: data.activeApplicationsNum.toString(),
        icon: 'briefcase',
        iconColor: 'primary'
      },
      {
        label: 'Mock Exams Taken',
        value: data.mockExamsTakenNumber.toString(),
        icon: 'clock-history',
        iconColor: 'warning'
      },
      {
        label: 'Average Score',
        value: data.averageExamsTakenScore + '%',
        icon: 'check-circle',
        iconColor: 'success'
      },
      {
        label: 'Skill Level',
        value: data.skillLevel,
        icon: 'star',
        iconColor: 'indigo'
      }
    ]);
  }

  timelineSteps = signal<any[]>([]);

  skills = signal<any[]>([]);

  applications = signal<any[]>([]);

  skillProgressData = signal<SkillProgressData[]>([]);

  getStatusIcon(status: string): string {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'examsent':
      case 'exam sent':
        return 'send-check';
      case 'atspassed':
      case 'ats passed':
        return 'file-earmark-check';
      case 'underreview':
      case 'under review':
        return 'eye';
      case 'completed':
        return 'check-circle';
      case 'rejected':
        return 'x-circle';
      default:
        return 'exclamation-circle';
    }
  }

  getStatusColor(status: string): string {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'examsent':
      case 'exam sent':
        return 'warning';
      case 'atspassed':
      case 'ats passed':
        return 'info';
      case 'underreview':
      case 'under review':
        return 'primary';
      case 'completed':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  private updateTimelineFromData(data: ApplicantDashboardData): void {
    if (data.applicationTimeline && data.applicationTimeline.length > 0) {
      const timeline = data.applicationTimeline
        .map((app) => ({
          id: app.applicationId || Math.random(),
          position: app.jobTitle,
          company: app.companyName,
          date: new Date(app.appliedAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          }),
          atsScore: app.atsScore,
          examStatus: app.examStatus ? app.examStatus.toLowerCase() : null,
          status: app.applicationStatus.toLowerCase()
        }))
        .slice(0, 3);
      this.timelineSteps.set(timeline);
    }
  }

  private updateSkillsFromData(data: ApplicantDashboardData): void {
    if (data.applicantSkillImprovementScore && data.applicantSkillImprovementScore.length > 0) {
      const skills = data.applicantSkillImprovementScore.map(skill => ({
        name: skill.skillName,
        score: skill.skillRating
      }));
      this.skills.set(skills);

      // Update skill progress data for the chart with 3 mock months for testing
      const progressData: SkillProgressData[] = [];
      const currentDate = new Date();
      
      // Create 3 months of data for each skill
      data.applicantSkillImprovementScore.forEach(skill => {
        const baseImprovement = skill.improvementPercentage || 0;
        
        // Month 1 (2 months ago)
        const month1 = new Date(currentDate);
        month1.setMonth(month1.getMonth() - 2);
        progressData.push({
          skillName: skill.skillName,
          month: month1.toISOString(),
          skillRating: Math.max(0, baseImprovement - 2),
          improvementPercentage: Math.max(0, baseImprovement - 2)
        });
        
        // Month 2 (1 month ago)
        const month2 = new Date(currentDate);
        month2.setMonth(month2.getMonth() - 1);
        progressData.push({
          skillName: skill.skillName,
          month: month2.toISOString(),
          skillRating: Math.max(0, baseImprovement - 1),
          improvementPercentage: Math.max(0, baseImprovement - 1)
        });
        
        // Month 3 (current month)
        progressData.push({
          skillName: skill.skillName,
          month: currentDate.toISOString(),
          skillRating: baseImprovement,
          improvementPercentage: baseImprovement
        });
      });
      
      this.skillProgressData.set(progressData);
    }
  }
}
