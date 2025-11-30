import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StatusTagComponent } from '../../shared/components/status-tag.component';

interface MockExam {
  id: number;
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questions: number;
  duration: number;
  attempts: number;
  bestScore: number | null;
  lastAttempt: string | null;
  status: 'not-started' | 'in-progress' | 'completed';
  description: string;
}

@Component({
  selector: 'app-mock-exams',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, StatusTagComponent],
  templateUrl: './mock-exams.component.html',
  styleUrls: ['./mock-exams.component.css']
})
export class MockExamsComponent {
  selectedCategory = 'all';
  selectedDifficulty = 'all';

  mockExams = signal<MockExam[]>([
    {
      id: 1,
      title: 'JavaScript Fundamentals',
      category: 'Technical',
      difficulty: 'Easy',
      questions: 20,
      duration: 30,
      attempts: 2,
      bestScore: 85,
      lastAttempt: 'Nov 25, 2025',
      status: 'completed',
      description: 'Test your basic JavaScript knowledge including variables, functions, and control structures.'
    },
    {
      id: 2,
      title: 'React Advanced Concepts',
      category: 'Technical',
      difficulty: 'Hard',
      questions: 25,
      duration: 45,
      attempts: 1,
      bestScore: 72,
      lastAttempt: 'Nov 23, 2025',
      status: 'completed',
      description: 'Deep dive into React hooks, context, performance optimization, and advanced patterns.'
    },
    {
      id: 3,
      title: 'Problem Solving & Logic',
      category: 'Aptitude',
      difficulty: 'Medium',
      questions: 30,
      duration: 40,
      attempts: 0,
      bestScore: null,
      lastAttempt: null,
      status: 'not-started',
      description: 'Evaluate your logical reasoning and problem-solving abilities.'
    },
    {
      id: 4,
      title: 'Communication Skills',
      category: 'Behavioral',
      difficulty: 'Easy',
      questions: 15,
      duration: 20,
      attempts: 1,
      bestScore: null,
      lastAttempt: 'Nov 20, 2025',
      status: 'in-progress',
      description: 'Assessment of your communication and interpersonal skills.'
    },
    {
      id: 5,
      title: 'English Proficiency',
      category: 'Language',
      difficulty: 'Medium',
      questions: 25,
      duration: 35,
      attempts: 3,
      bestScore: 91,
      lastAttempt: 'Nov 18, 2025',
      status: 'completed',
      description: 'Comprehensive English language test covering grammar, vocabulary, and comprehension.'
    },
    {
      id: 6,
      title: 'Database Design',
      category: 'Technical',
      difficulty: 'Medium',
      questions: 20,
      duration: 30,
      attempts: 0,
      bestScore: null,
      lastAttempt: null,
      status: 'not-started',
      description: 'Test your knowledge of database concepts, SQL, and normalization.'
    }
  ]);

  filteredExams = signal<MockExam[]>(this.mockExams());

  filterExams() {
    let filtered = this.mockExams();

    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(exam => exam.category === this.selectedCategory);
    }

    if (this.selectedDifficulty !== 'all') {
      filtered = filtered.filter(exam => exam.difficulty === this.selectedDifficulty);
    }

    this.filteredExams.set(filtered);
  }

  getDifficultyClass(difficulty: string): string {
    switch(difficulty) {
      case 'Easy': return 'success';
      case 'Medium': return 'warning';
      case 'Hard': return 'danger';
      default: return 'secondary';
    }
  }

  totalAttempts(): number {
    return this.mockExams().reduce((sum, exam) => sum + exam.attempts, 0);
  }

  completedExams(): number {
    return this.mockExams().filter(exam => exam.status === 'completed').length;
  }

  inProgressExams(): number {
    return this.mockExams().filter(exam => exam.status === 'in-progress').length;
  }

  averageScore(): number {
    const examsWithScores = this.mockExams().filter(exam => exam.bestScore !== null);
    if (examsWithScores.length === 0) return 0;
    
    const sum = examsWithScores.reduce((acc, exam) => acc + (exam.bestScore || 0), 0);
    return Math.round(sum / examsWithScores.length);
  }
}
