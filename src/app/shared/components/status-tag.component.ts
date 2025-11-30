import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusType = 'passed' | 'failed' | 'pending' | 'in-progress' | 'interview' | 'rejected' | 'accepted';

@Component({
  selector: 'app-status-tag',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-tag.component.html'
})
export class StatusTagComponent {
  status = input.required<StatusType>();
  label = input<string>('');
}
