import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

export interface User {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  user = input<User | null>(null);
  notificationCount = input<number>(0);
  onLogout = output<void>();

  searchQuery = '';

  // Computed properties for dynamic routes
  profileRoute = computed(() => {
    return this.router.url.startsWith('/hr') ? '/hr/profile' : '/applicant/profile';
  });

  settingsRoute = computed(() => {
    return this.router.url.startsWith('/hr') ? '/hr/settings' : '/applicant/settings';
  });

  constructor(private router: Router) {}

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  handleSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/applicant/jobs'], {
        queryParams: { search: this.searchQuery.trim() }
      });
    } else {
      this.router.navigate(['/applicant/jobs']);
    }
  }
}
