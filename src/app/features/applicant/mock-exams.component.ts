import { Component, signal, OnInit, inject, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StatusTagComponent } from '../../shared/components/status-tag.component';
import { MockExamsService, MockExamQuickStats, MockExam as ApiMockExam } from '../../core/services/mock-exams.service';

interface MockExam extends ApiMockExam {
  id: number;
}

@Component({
  selector: 'app-mock-exams',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, StatusTagComponent],
  templateUrl: './mock-exams.component.html',
  styleUrls: ['./mock-exams.component.css']
})
export class MockExamsComponent implements OnInit {
  private mockExamsService = inject(MockExamsService);
  
  selectedCategory = 'all';
  selectedDifficulty = 'all';
  
  quickStats = signal<MockExamQuickStats | null>(null);
  isLoadingStats = signal<boolean>(true);

  recommendedExams = signal<MockExam[]>([]);
  allExamsData = signal<MockExam[]>([]);
  isLoadingExams = signal<boolean>(true);
  isLoadingMoreExams = signal<boolean>(false);

  filteredRecommendedExams = signal<MockExam[]>([]);
  displayedAllExams = signal<MockExam[]>([]);
  hasMoreExams = signal<boolean>(true);

  private itemsPerPage = 6;
  private currentPageIndex = 0;
  private hasMoreExamsPrivate = true;

  @ViewChild('scrollContainer') scrollContainer?: ElementRef;

  ngOnInit() {
    // TODO: Replace with actual applicant ID from auth service
    const applicantId = '2'; // Changed to test with applicantId = 2
    this.loadQuickStats(applicantId);
    this.loadMockExams(applicantId);
  }

  loadQuickStats(applicantId: string) {
    this.isLoadingStats.set(true);
    this.mockExamsService.getQuickStats(applicantId).subscribe({
      next: (stats) => {
        this.quickStats.set(stats);
        this.isLoadingStats.set(false);
      },
      error: (error) => {
        console.error('Error loading quick stats:', error);
        // Set mock data as fallback for development
        this.quickStats.set({
          mockExamsTakenNumber: 4,
          mockExamsTakenNumberForCurrentMonth: 1,
          averageExamsTakenScore: 85,
          averageExamsTakenScoreImprovement: 13
        });
        this.isLoadingStats.set(false);
      }
    });
  }

  loadMockExams(applicantId: string) {
    this.isLoadingExams.set(true);
    console.log('Loading exams with applicantId:', applicantId);
    
    this.mockExamsService.getRecommendedMockExams(applicantId).subscribe({
      next: (exams) => {
        console.log('Recommended exams loaded:', exams);
        const recommendedWithIds = exams.map((exam, index) => ({
          ...exam,
          id: index + 1
        }));
        this.recommendedExams.set(recommendedWithIds);
        this.filteredRecommendedExams.set(recommendedWithIds);
      },
      error: (error) => {
        console.error('Error loading recommended exams:', error);
        console.error('URL attempted: http://localhost:5290/api/Exam/RecommendedMockExams/' + applicantId);
      }
    });

    this.mockExamsService.getAllMockExams(applicantId).subscribe({
      next: (exams) => {
        console.log('All exams loaded:', exams);
        const allWithIds = exams.map((exam, index) => ({
          ...exam,
          id: index + 100
        }));
        this.allExamsData.set(allWithIds);
        this.currentPageIndex = 0;
        this.hasMoreExamsPrivate = true;
        this.hasMoreExams.set(true);
        this.loadMoreExams();
        this.isLoadingExams.set(false);
      },
      error: (error) => {
        console.error('Error loading all exams:', error);
        console.error('URL attempted: http://localhost:5290/api/Exam/AllMockExams/' + applicantId);
        this.isLoadingExams.set(false);
      }
    });
  }

  loadMoreExams() {
    if (this.isLoadingMoreExams() || !this.hasMoreExamsPrivate) {
      return;
    }

    this.isLoadingMoreExams.set(true);
    
    // Simulate a slight delay to show loading skeleton
    setTimeout(() => {
      const filtered = this.filterExamsList(this.allExamsData());
      const startIndex = this.currentPageIndex * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      const newExams = filtered.slice(startIndex, endIndex);

      if (newExams.length === 0) {
        this.hasMoreExamsPrivate = false;
        this.hasMoreExams.set(false);
        this.isLoadingMoreExams.set(false);
        return;
      }

      this.displayedAllExams.set([...this.displayedAllExams(), ...newExams]);
      this.currentPageIndex++;
      this.isLoadingMoreExams.set(false);

      if (endIndex >= filtered.length) {
        this.hasMoreExamsPrivate = false;
        this.hasMoreExams.set(false);
      }
    }, 500);
  }

  filterExams() {
    // Reset pagination when filtering
    this.currentPageIndex = 0;
    this.hasMoreExamsPrivate = true;
    this.hasMoreExams.set(true);
    this.displayedAllExams.set([]);
    this.loadMoreExams();

    const recommendedFiltered = this.filterExamsList(this.recommendedExams());
    this.filteredRecommendedExams.set(recommendedFiltered);
  }

  private filterExamsList(exams: MockExam[]): MockExam[] {
    let filtered = exams;

    if (this.selectedDifficulty !== 'all') {
      filtered = filtered.filter(exam => exam.examLevel === this.selectedDifficulty);
    }

    return filtered;
  }

  onScroll(event: Event) {
    const element = event.target as HTMLElement;
    const scrollPosition = element.scrollTop + element.clientHeight;
    const scrollHeight = element.scrollHeight;

    // Trigger load when user scrolls to 80% of the container
    if (scrollPosition >= scrollHeight * 0.8) {
      this.loadMoreExams();
    }
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;

    // Trigger load when user scrolls to 80% of the page
    if (scrollPosition >= documentHeight * 0.8) {
      this.loadMoreExams();
    }
  }

  getDifficultyClass(level: string): string {
    switch(level) {
      case 'Beginner': return 'success';
      case 'Intermediate': return 'warning';
      case 'Advanced': return 'danger';
      default: return 'secondary';
    }
  }
}
