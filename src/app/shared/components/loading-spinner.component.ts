import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-spinner.component.html'
})
export class LoadingSpinnerComponent {
  size = input<'small' | 'medium' | 'large'>('medium');
  color = input<'primary' | 'secondary' | 'success'>('primary');
  message = input<string>('Loading...');

  getSize(): string {
    const sizes = {
      small: '1.5rem',
      medium: '2.5rem',
      large: '3.5rem'
    };
    return sizes[this.size()];
  }
}
