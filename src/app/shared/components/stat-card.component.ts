import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StatCardData {
  label: string;
  value: string | number;
  icon: string;
  iconColor: 'primary' | 'success' | 'warning' | 'indigo';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html'
})
export class StatCardComponent {
  data = input.required<StatCardData>();
}
