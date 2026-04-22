import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  imports: [CommonModule],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {
  navItems = [
    { label: 'À PROPOS', action: () => this.navigate('About') },
  ];

  navigate(section: string): void {
    console.log('Navigate to', section);
  }
}
