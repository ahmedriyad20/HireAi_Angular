import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationDetailsService } from '../../core/services/application-details.service';
import { ApplicationDetails } from '../../core/models/application-details.model';
import { StatusTagComponent } from '../../shared/components/status-tag.component';

@Component({
  selector: 'app-application-details',
  standalone: true,
  imports: [CommonModule, StatusTagComponent],
  templateUrl: './application-details.component.html',
  styleUrls: ['./application-details.component.css']
})
export class ApplicationDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private applicationDetailsService = inject(ApplicationDetailsService);

  applicationDetails = signal<ApplicationDetails | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const applicationId = Number(this.route.snapshot.paramMap.get('applicationId'));
    const applicantId = Number(this.route.snapshot.paramMap.get('applicantId'));

    if (!applicationId || !applicantId) {
      this.error.set('Invalid application or applicant ID');
      this.isLoading.set(false);
      return;
    }

    this.loadApplicationDetails(applicationId, applicantId);
  }

  private loadApplicationDetails(applicationId: number, applicantId: number): void {
    this.isLoading.set(true);
    this.applicationDetailsService.getApplicationDetails(applicationId, applicantId).subscribe({
      next: (data) => {
        this.applicationDetails.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading application details:', error);
        this.error.set('Failed to load application details');
        this.isLoading.set(false);
      }
    });
  }

  getStatusText(status: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'Pending',
      1: 'Under Review',
      2: 'Interview',
      3: 'Offer',
      4: 'Accepted/Rejected'
    };
    return statusMap[status] || 'Unknown';
  }

  getStatusClass(status: number): 'pending' | 'in-progress' | 'interview' | 'accepted' | 'rejected' {
    if (status === 0) return 'pending';
    if (status >= 1 && status <= 3) return 'in-progress';
    return 'accepted';
  }

  getExamStatusText(status: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'Not Started',
      1: 'In Progress',
      2: 'Completed',
      3: 'Evaluated'
    };
    return statusMap[status] || 'Unknown';
  }

  goBack(): void {
    this.router.navigate(['/applicant/applications']);
  }
}
