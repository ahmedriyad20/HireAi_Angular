import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

export interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  section?: string;
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  collapsed = input<boolean>(false);
  menuSections = input<{ title: string; items: MenuItem[] }[]>([]);
  onToggleCollapse = output<boolean>();

  toggleCollapse() {
    this.onToggleCollapse.emit(!this.collapsed());
  }
}
