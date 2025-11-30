import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StatusTagComponent } from '../../shared/components/status-tag.component';

interface Application {
  id: number;
  jobTitle: string;
  company: string;
  location: string;
  jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  appliedDate: string;
  status: 'pending' | 'in-progress' | 'interview' | 'rejected' | 'accepted';
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
export class MyApplicationsComponent {
  private router = inject(Router);
  
  filterStatus = 'all';
  filterJobType = 'all';
  searchQuery = '';
  expandedApp = signal<number | null>(null);

  applications = signal<Application[]>([
    {
      id: 1,
      jobTitle: 'Senior Frontend Developer',
      company: 'TechCorp Solutions',
      location: 'San Francisco, CA',
      jobType: 'Full-time',
      appliedDate: 'Nov 25, 2025',
      status: 'interview',
      atsScore: 92,
      examScore: 88,
      examStatus: 'completed',
      interviewDate: 'Dec 5, 2025',
      salary: '$120k - $150k',
      description: 'We are looking for an experienced Frontend Developer to join our team. You will work on building scalable web applications using React and TypeScript.'
    },
    {
      id: 2,
      jobTitle: 'Full Stack Engineer',
      company: 'InnovateLab',
      location: 'Remote',
      jobType: 'Full-time',
      appliedDate: 'Nov 22, 2025',
      status: 'in-progress',
      atsScore: 85,
      examScore: null,
      examStatus: 'pending',
      salary: '$100k - $130k',
      description: 'Join our dynamic team to build cutting-edge web applications. Experience with Node.js, React, and MongoDB required.'
    },
    {
      id: 1,
      jobTitle: 'React Developer Intern',
      company: 'StartupHub',
      location: 'New York, NY',
      jobType: 'Internship',
      appliedDate: 'Nov 20, 2025',
      status: 'accepted',
      atsScore: 88,
      examScore: 95,
      examStatus: 'completed',
      salary: '$25/hour',
      description: 'Great opportunity for students to gain hands-on experience with React development in a fast-paced startup environment.'
    },
    {
      id: 4,
      jobTitle: 'UI/UX Developer',
      company: 'DesignPro Agency',
      location: 'Los Angeles, CA',
      jobType: 'Contract',
      appliedDate: 'Nov 18, 2025',
      status: 'rejected',
      atsScore: 65,
      examScore: 72,
      examStatus: 'completed',
      salary: '$80k - $100k',
      description: 'Looking for a creative developer with strong design skills to create beautiful and intuitive user interfaces.'
    },
    {
      id: 5,
      jobTitle: 'JavaScript Developer',
      company: 'WebWorks Inc',
      location: 'Austin, TX',
      jobType: 'Full-time',
      appliedDate: 'Nov 15, 2025',
      status: 'pending',
      atsScore: null,
      examScore: null,
      examStatus: 'pending',
      salary: '$90k - $120k',
      description: 'Seeking a skilled JavaScript developer to work on various client projects. Strong knowledge of ES6+ required.'
    },
    {
      id: 6,
      jobTitle: 'Frontend Developer',
      company: 'CloudTech Systems',
      location: 'Seattle, WA',
      jobType: 'Full-time',
      appliedDate: 'Nov 12, 2025',
      status: 'in-progress',
      atsScore: 78,
      examScore: null,
      examStatus: 'scheduled',
      interviewDate: 'Dec 2, 2025',
      salary: '$110k - $140k',
      description: 'Work on cloud-based applications using modern JavaScript frameworks. Experience with AWS is a plus.'
    },
    {
      id: 7,
      jobTitle: 'Part-time Web Developer',
      company: 'Local Business Solutions',
      location: 'Boston, MA',
      jobType: 'Part-time',
      appliedDate: 'Nov 10, 2025',
      status: 'pending',
      atsScore: 82,
      examScore: null,
      examStatus: 'pending',
      salary: '$45/hour',
      description: 'Flexible part-time position helping local businesses build and maintain their web presence.'
    }
  ]);

  filteredApplications = signal<Application[]>(this.applications());

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
    return this.applications().filter(app => app.status === 'pending').length;
  }

  getInterviewCount(): number {
    return this.applications().filter(app => app.status === 'interview').length;
  }

  getAcceptedCount(): number {
    return this.applications().filter(app => app.status === 'accepted').length;
  }

  viewApplicationDetails(applicationId: number): void {
    // TODO: Replace with actual applicant ID from auth service
    const applicantId = 2;
    this.router.navigate(['/applicant/applications', applicationId, applicantId]);
  }
}
