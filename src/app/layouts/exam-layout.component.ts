import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-exam-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="exam-layout">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .exam-layout {
      min-height: 100vh;
      background-color: var(--bg-primary);
    }
  `]
})
export class ExamLayoutComponent {}
