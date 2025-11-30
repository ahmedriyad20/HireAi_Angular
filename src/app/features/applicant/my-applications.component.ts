import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StatusTagComponent } from '../../shared/components/status-tag.component';
import { ApplicationsService } from '../../core/services/applications.service';
import { AvailableJobsService } from '../../core/services/available-jobs.service';

interface Application {
  id: number;
  applicationId: number;
  jobTitle: string;
  company: string;
  location: string;
  jobType: 'FullTime' | 'PartTime' | 'Internship' | 'FreeLance';
  appliedDate: string;
  status: 'ExamSent' | 'ATSPassed' | 'UnderReview' | 'Completed' | 'Rejected';
  atsScore: number | null;
  examScore: number | null;
  examStatus: 'pending' | 'completed' | 'scheduled';
  interviewDate?: string;
  salary?: string;
  description: string;
}

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusTagComponent],
  templateUrl: './my-applications.component.html',
  styleUrls: ['./my-applications.component.css']
})
export class MyApplicationsComponent implements OnInit {
  private router = inject(Router);
  private applicationsService = inject(ApplicationsService);
  private jobsService = inject(AvailableJobsService);
  
  filterStatus = 'all';
  filterJobType = 'all';
  searchQuery = '';
  expandedApp = signal<number | null>(null);

  applications = signal<Application[]>([]);

  filteredApplications = signal<Application[]>(this.applications());

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    // TODO: Replace with actual applicant ID from auth service
    const applicantId = 2;
    
    this.applicationsService.getApplicationsList(applicantId).subscribe({
      next: (response) => {
        const mappedApplications: Application[] = response.map((app, index) => ({
          id: index + 1,
          applicationId: app.applicationId,
          jobTitle: app.jobTitle,
          company: app.companyName,
          location: app.companyLocation,
          jobType: 'FullTime', // Default since API doesn't provide this
          appliedDate: new Date(app.appliedAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          status: app.applicationStatus as 'ExamSent' | 'ATSPassed' | 'UnderReview' | 'Completed' | 'Rejected',
          atsScore: app.atsScore,
          examScore: null, // Not provided by API
          examStatus: 'pending', // Default since API doesn't provide this
          description: '' // Not provided by API
        }));
        
        this.applications.set(mappedApplications);
        this.filteredApplications.set(mappedApplications);
      },
      error: (error) => {
        console.error('Error loading applications:', error);
      }
    });
  }

  applyFilters() {
    let filtered = this.applications();

    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(app => app.status === this.filterStatus);
    }

    if (this.filterJobType !== 'all') {
      filtered = filtered.filter(app => app.jobType === this.filterJobType);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.jobTitle.toLowerCase().includes(query) ||
        app.company.toLowerCase().includes(query)
      );
    }

    this.filteredApplications.set(filtered);
  }

  resetFilters() {
    this.filterStatus = 'all';
    this.filterJobType = 'all';
    this.searchQuery = '';
    this.filteredApplications.set(this.applications());
  }

  toggleExpand(id: number) {
    this.expandedApp.set(this.expandedApp() === id ? null : id);
  }

  getPendingCount(): number {
    return this.applications().filter(app => app.status === 'UnderReview' || app.status === 'ExamSent').length;
  }

  getInterviewCount(): number {
    return this.applications().filter(app => app.status === 'ATSPassed').length;
  }

  getAcceptedCount(): number {
    return this.applications().filter(app => app.status === 'Completed').length;
  }

  viewApplicationDetails(application: Application): void {
    // TODO: Replace with actual applicant ID from auth service
    const applicantId = 2;
    this.router.navigate(['/applicant/applications', application.applicationId, applicantId]);
  }

  getJobIcon(title: string): string {
    return this.jobsService.getJobIcon(title);
  }
}
