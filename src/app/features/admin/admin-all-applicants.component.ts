import { Component, signal, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { ApplicantListItem, ApplicantUpdateRequest } from '../../core/models/admin.model';

@Component({
  selector: 'app-admin-all-applicants',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-all-applicants.component.html',
  styleUrls: ['./admin-all-applicants.component.css']
})
export class AdminAllApplicantsComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  allApplicants = signal<ApplicantListItem[]>([]); // All loaded applicants
  displayedApplicants = signal<ApplicantListItem[]>([]); // Currently displayed (with pagination)
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  // Infinite scroll & pagination
  pageSize = 10; // Load 10 applicants at a time
  currentPage = 0;
  isLoadingMore = signal<boolean>(false);
  hasMoreData = signal<boolean>(true);
  
  // Search
  searchQuery = signal<string>('');
  filteredApplicants = signal<ApplicantListItem[]>([]);
  
  // Skeleton loading
  skeletons = Array(3).fill(0); // Show 3 skeleton cards initially
  
  // Update modal state
  showUpdateModal = signal<boolean>(false);
  selectedApplicant = signal<ApplicantListItem | null>(null);
  updateForm = signal<ApplicantUpdateRequest>({
    id: 0,
    email: '',
    fullName: '',
    address: '',
    phone: '',
    dateOfBirth: '',
    title: '',
    bio: '',
    isActive: true,
    resumeUrl: '',
    skillLevel: 'Beginner'
  });
  isUpdating = signal<boolean>(false);
  
  // Delete modal state
  showDeleteModal = signal<boolean>(false);
  applicantToDelete = signal<ApplicantListItem | null>(null);
  isDeleting = signal<boolean>(false);

  ngOnInit(): void {
    this.loadApplicants();
  }

  loadApplicants(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.adminService.getAllApplicants().subscribe({
      next: (data) => {
        this.allApplicants.set(data);
        this.filteredApplicants.set(data);
        this.loadMore(); // Load first page
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading applicants:', error);
        if (error.status === 403) {
          this.error.set('Access denied. You do not have admin permissions.');
        } else if (error.status === 401) {
          this.error.set('Your session has expired. Please login again.');
        } else {
          this.error.set('Failed to load applicants. Please try again later.');
        }
        this.isLoading.set(false);
      }
    });
  }

  loadMore(): void {
    if (!this.hasMoreData() || this.isLoadingMore()) return;

    this.isLoadingMore.set(true);
    
    // Simulate async loading with setTimeout (in real app, this would be server pagination)
    setTimeout(() => {
      const start = this.currentPage * this.pageSize;
      const end = start + this.pageSize;
      const newApplicants = this.filteredApplicants().slice(start, end);
      
      if (newApplicants.length > 0) {
        this.displayedApplicants.update(current => [...current, ...newApplicants]);
        this.currentPage++;
      }
      
      // Check if there's more data
      if (end >= this.filteredApplicants().length) {
        this.hasMoreData.set(false);
      }
      
      this.isLoadingMore.set(false);
    }, 500);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const scrollPosition = window.pageYOffset + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;
    
    // Load more when user scrolls to bottom (with 100px threshold)
    if (scrollPosition >= pageHeight - 100 && !this.isLoadingMore() && this.hasMoreData()) {
      this.loadMore();
    }
  }

  onSearch(): void {
    const query = this.searchQuery().toLowerCase().trim();
    
    if (!query) {
      // Reset to show all
      this.filteredApplicants.set(this.allApplicants());
    } else {
      // Filter by name
      const filtered = this.allApplicants().filter(applicant =>
        applicant.fullName.toLowerCase().includes(query)
      );
      this.filteredApplicants.set(filtered);
    }
    
    // Reset pagination
    this.currentPage = 0;
    this.displayedApplicants.set([]);
    this.hasMoreData.set(true);
    this.loadMore();
  }

  downloadResume(resumeUrl: string): void {
    if (!resumeUrl) {
      alert('No resume available for this applicant');
      return;
    }

    // Check authentication
    const token = this.authService.getToken();
    if (!token) {
      alert('You must be logged in to download resumes.');
      return;
    }

    // Use the new endpoint with fileKey parameter
    const fileKey = encodeURIComponent(resumeUrl);
    const downloadUrl = `http://localhost:5290/api/Applicant/DownloadResume?fileKey=${fileKey}`;
    
    console.log('Downloading resume from:', downloadUrl);

    // Use HttpClient to download the file as a blob with authentication headers
    this.http.get(downloadUrl, { responseType: 'blob', observe: 'response' }).subscribe({
      next: (response) => {
        // Extract filename from content-disposition header or use default
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'Resume.pdf';
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename\*?=["']?(?:UTF-8'')?([^"';]+)["']?/i);
          if (filenameMatch && filenameMatch[1]) {
            filename = decodeURIComponent(filenameMatch[1]);
          }
        }

        // Create blob URL and trigger download
        const blob = response.body;
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          window.URL.revokeObjectURL(url);
        }
      },
      error: (error) => {
        console.error('Error downloading resume:', error);
        
        if (error.status === 403) {
          alert('Access denied. You do not have permission to download this resume.');
        } else if (error.status === 401) {
          alert('Unauthorized. Please log in again.');
        } else if (error.status === 404) {
          alert('Resume file not found.');
        } else {
          alert('Failed to download resume. Please try again.');
        }
      }
    });
  }

  openUpdateModal(applicant: ApplicantListItem): void {
    this.selectedApplicant.set(applicant);
    this.updateForm.set({
      id: applicant.id,
      email: applicant.email,
      fullName: applicant.fullName,
      address: applicant.address,
      phone: applicant.phone,
      dateOfBirth: applicant.dateOfBirth.split('T')[0], // Format date for input
      title: applicant.title || '',
      bio: applicant.bio || '',
      isActive: applicant.isActive,
      resumeUrl: applicant.resumeUrl,
      skillLevel: applicant.skillLevel as 'Beginner' | 'Intermediate' | 'Advanced'
    });
    this.showUpdateModal.set(true);
  }

  closeUpdateModal(): void {
    this.showUpdateModal.set(false);
    this.selectedApplicant.set(null);
  }

  submitUpdate(): void {
    const form = this.updateForm();
    if (!form.id) return;

    this.isUpdating.set(true);

    this.adminService.updateApplicant(form.id, form).subscribe({
      next: () => {
        this.isUpdating.set(false);
        this.closeUpdateModal();
        // Reset pagination state before reloading
        this.currentPage = 0;
        this.displayedApplicants.set([]);
        this.hasMoreData.set(true);
        this.loadApplicants();
      },
      error: (error) => {
        console.error('Error updating applicant:', error);
        alert('Failed to update applicant. Please try again.');
        this.isUpdating.set(false);
      }
    });
  }

  openDeleteModal(applicant: ApplicantListItem): void {
    this.applicantToDelete.set(applicant);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.applicantToDelete.set(null);
  }

  confirmDelete(): void {
    const applicant = this.applicantToDelete();
    if (!applicant) return;

    this.isDeleting.set(true);

    this.adminService.deleteApplicant(applicant.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        // Reset pagination state before reloading
        this.currentPage = 0;
        this.displayedApplicants.set([]);
        this.hasMoreData.set(true);
        this.loadApplicants();
      },
      error: (error) => {
        console.error('Error deleting applicant:', error);
        alert('Failed to delete applicant. Please try again.');
        this.isDeleting.set(false);
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString || dateString === '0001-01-01' || dateString.startsWith('0001-01-01')) {
      return 'N/A';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'badge bg-success' : 'badge bg-secondary';
  }

  getSkillLevelBadgeClass(skillLevel: string): string {
    switch (skillLevel.toLowerCase()) {
      case 'beginner':
        return 'badge bg-info';
      case 'intermediate':
        return 'badge bg-warning';
      case 'advanced':
        return 'badge bg-primary';
      default:
        return 'badge bg-secondary';
    }
  }
}
