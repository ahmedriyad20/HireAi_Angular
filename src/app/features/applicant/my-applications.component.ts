import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StatusTagComponent } from '../../shared/components/status-tag.component';
import { ApplicationsService } from '../../core/services/applications.service';
import { AvailableJobsService } from '../../core/services/available-jobs.service';
import { AuthService } from '../../core/services/auth.service';

interface Application {
  id: number;
  applicationId: number;
  jobTitle: string;
  company: string;
  location: string;
  jobType: 'FullTime' | 'PartTime' | 'Internship' | 'FreeLance';
  appliedDate: string;
  rawAppliedDate: Date;
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
  private authService = inject(AuthService);
  
  filterStatus = 'all';
  filterJobType = 'all';
  filterDate = 'all';
  searchQuery = '';
  expandedApp = signal<number | null>(null);

  applications = signal<Application[]>([]);
  error = signal<string | null>(null);
  isLoading = signal<boolean>(true);
  
  // Modal state
  showDeleteModal = signal<boolean>(false);
  applicationToDelete = signal<Application | null>(null);
  deleteActionText = signal<string>('');

  filteredApplications = signal<Application[]>(this.applications());

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
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
    
    this.applicationsService.getApplicationsList(applicantId).subscribe({
      next: (response) => {
        const mappedApplications: Application[] = response.map((app, index) => ({
          id: index + 1,
          applicationId: app.applicationId,
          jobTitle: app.jobTitle,
          company: app.companyName,
          location: app.companyLocation,
          jobType: app.jobType as 'FullTime' | 'PartTime' | 'Internship' | 'FreeLance',
          appliedDate: new Date(app.appliedAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          rawAppliedDate: new Date(app.appliedAt),
          status: app.applicationStatus as 'ExamSent' | 'ATSPassed' | 'UnderReview' | 'Completed' | 'Rejected',
          atsScore: app.atsScore,
          examScore: null, // Not provided by API
          examStatus: 'pending', // Default since API doesn't provide this
          description: '' // Not provided by API
        }));
        
        this.applications.set(mappedApplications);
        this.filteredApplications.set(mappedApplications);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading applications:', error);
        if (error.status === 403) {
          this.error.set('Access denied. You do not have permission to view these applications.');
        } else if (error.status === 401) {
          this.error.set('Your session has expired. Please login again.');
        } else {
          this.error.set('Failed to load applications. Please try again later.');
        }
        this.isLoading.set(false);
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

    if (this.filterDate !== 'all') {
      const now = new Date();
      filtered = filtered.filter(app => {
        const diffTime = Math.abs(now.getTime() - app.rawAppliedDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        switch(this.filterDate) {
          case 'today':
            return diffDays <= 1;
          case 'week':
            return diffDays <= 7;
          case 'month':
            return diffDays <= 30;
          case '3months':
            return diffDays <= 90;
          case '6months':
            return diffDays <= 180;
          case 'year':
            return diffDays <= 365;
          default:
            return true;
        }
      });
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
    this.filterDate = 'all';
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
    this.router.navigate(['/applicant/applications', application.applicationId]);
  }

  getJobIcon(title: string): string {
    return this.jobsService.getJobIcon(title);
  }

  // Check if application should show "Take Exam" button
  shouldShowTakeExam(status: Application['status']): boolean {
    return status === 'ATSPassed';
  }

  // Check if application should show "Withdraw Application" button
  shouldShowWithdraw(status: Application['status']): boolean {
    return status === 'ExamSent' || status === 'ATSPassed' || status === 'UnderReview';
  }

  // Check if application should show "Delete Application" button
  shouldShowDelete(status: Application['status']): boolean {
    return status === 'Completed' || status === 'Rejected';
  }

  // Get button text based on status
  getDeleteButtonText(status: Application['status']): string {
    if (status === 'Completed' || status === 'Rejected') {
      return 'Delete Application';
    }
    return 'Withdraw Application';
  }

  // Handle Take Exam action
  takeExam(application: Application): void {
    // TODO: Navigate to exam page or implement exam logic
    console.log('Taking exam for application:', application.applicationId);
    // Example: this.router.navigate(['/applicant/exam', application.applicationId]);
    alert('Exam functionality will be implemented. Application ID: ' + application.applicationId);
  }

  // Handle Delete/Withdraw Application
  deleteApplication(application: Application, event: Event): void {
    event.stopPropagation();
    
    const actionText = this.getDeleteButtonText(application.status);
    this.applicationToDelete.set(application);
    this.deleteActionText.set(actionText);
    this.showDeleteModal.set(true);
  }

  // Confirm deletion
  confirmDelete(): void {
    const application = this.applicationToDelete();
    if (!application) return;

    const actionText = this.deleteActionText();

    this.applicationsService.deleteApplication(application.applicationId).subscribe({
      next: () => {
        // Remove the application from the list
        const updatedApplications = this.applications().filter(
          app => app.applicationId !== application.applicationId
        );
        this.applications.set(updatedApplications);
        this.applyFilters();
        
        this.closeDeleteModal();
      },
      error: (error) => {
        console.error('Error deleting application:', error);
        this.error.set(`Failed to ${actionText.toLowerCase()}. Please try again.`);
        this.closeDeleteModal();
      }
    });
  }

  // Close modal
  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.applicationToDelete.set(null);
    this.deleteActionText.set('');
  }
}
