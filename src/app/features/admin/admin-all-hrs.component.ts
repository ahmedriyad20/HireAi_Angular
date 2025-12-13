import { Component, signal, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { HRListItem, HRUpdateRequest } from '../../core/models/admin.model';

@Component({
  selector: 'app-admin-all-hrs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-all-hrs.component.html',
  styleUrls: ['./admin-all-hrs.component.css']
})
export class AdminAllHRsComponent implements OnInit {
  private adminService = inject(AdminService);

  allHRs = signal<HRListItem[]>([]); // All loaded HRs
  displayedHRs = signal<HRListItem[]>([]); // Currently displayed (with pagination)
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  // Infinite scroll & pagination
  pageSize = 10; // Load 10 HRs at a time
  currentPage = 0;
  isLoadingMore = signal<boolean>(false);
  hasMoreData = signal<boolean>(true);
  
  // Search
  searchQuery = signal<string>('');
  filteredHRs = signal<HRListItem[]>([]);
  
  // Skeleton loading
  skeletons = Array(3).fill(0); // Show 3 skeleton cards initially
  
  // Update modal state
  showUpdateModal = signal<boolean>(false);
  selectedHR = signal<HRListItem | null>(null);
  updateForm = signal<HRUpdateRequest>({
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
    accountType: 'Free',
    premiumExpiry: null
  });
  isUpdating = signal<boolean>(false);
  
  // Delete modal state
  showDeleteModal = signal<boolean>(false);
  hrToDelete = signal<HRListItem | null>(null);
  isDeleting = signal<boolean>(false);

  ngOnInit(): void {
    this.loadHRs();
  }

  loadHRs(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.adminService.getAllHRs().subscribe({
      next: (data) => {
        this.allHRs.set(data);
        this.filteredHRs.set(data);
        this.loadMore(); // Load first page
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading HRs:', error);
        if (error.status === 403) {
          this.error.set('Access denied. You do not have admin permissions.');
        } else if (error.status === 401) {
          this.error.set('Your session has expired. Please login again.');
        } else {
          this.error.set('Failed to load HRs. Please try again later.');
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
      const newHRs = this.filteredHRs().slice(start, end);
      
      if (newHRs.length > 0) {
        this.displayedHRs.update(current => [...current, ...newHRs]);
        this.currentPage++;
      }
      
      // Check if there's more data
      if (end >= this.filteredHRs().length) {
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
      this.filteredHRs.set(this.allHRs());
    } else {
      // Filter by name
      const filtered = this.allHRs().filter(hr =>
        hr.fullName.toLowerCase().includes(query)
      );
      this.filteredHRs.set(filtered);
    }
    
    // Reset pagination
    this.currentPage = 0;
    this.displayedHRs.set([]);
    this.hasMoreData.set(true);
    this.loadMore();
  }

  openUpdateModal(hr: HRListItem): void {
    this.selectedHR.set(hr);
    this.updateForm.set({
      fullName: hr.fullName,
      address: hr.address,
      phone: hr.phone,
      isPremium: hr.isPremium,
      bio: hr.bio || '',
      title: hr.title,
      isActive: hr.isActive,
      companyName: hr.companyName,
      companyDescription: hr.companyDescription,
      companyAddress: hr.companyAddress,
      accountType: hr.accountType,
      premiumExpiry: hr.premiumExpiry
    });
    this.showUpdateModal.set(true);
  }

  closeUpdateModal(): void {
    this.showUpdateModal.set(false);
    this.selectedHR.set(null);
  }

  submitUpdate(): void {
    const hr = this.selectedHR();
    if (!hr) return;

    this.isUpdating.set(true);

    this.adminService.updateHR(hr.id, this.updateForm()).subscribe({
      next: () => {
        this.isUpdating.set(false);
        this.closeUpdateModal();
        // Reset pagination state before reloading
        this.currentPage = 0;
        this.displayedHRs.set([]);
        this.hasMoreData.set(true);
        this.loadHRs();
      },
      error: (error) => {
        console.error('Error updating HR:', error);
        alert('Failed to update HR. Please try again.');
        this.isUpdating.set(false);
      }
    });
  }

  openDeleteModal(hr: HRListItem): void {
    this.hrToDelete.set(hr);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.hrToDelete.set(null);
  }

  confirmDelete(): void {
    const hr = this.hrToDelete();
    if (!hr) return;

    this.isDeleting.set(true);

    this.adminService.deleteHR(hr.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        // Reset pagination state before reloading
        this.currentPage = 0;
        this.displayedHRs.set([]);
        this.hasMoreData.set(true);
        this.loadHRs();
      },
      error: (error) => {
        console.error('Error deleting HR:', error);
        alert('Failed to delete HR. Please try again.');
        this.isDeleting.set(false);
      }
    });
  }

  formatDate(dateString: string | null): string {
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

  getAccountTypeBadgeClass(isPremium: boolean): string {
    return isPremium ? 'badge bg-primary' : 'badge bg-info';
  }
}
