import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BentoNavbar } from '../../components/bentos/bento-navbar/bento-navbar';
@Component({
  selector: 'app-landing',
  imports: [CommonModule, BentoNavbar],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {

  // Placeholder Navigation -- TODO : Edit or delete
  navItems = [
    { label: 'À PROPOS', action: () => this.navigate('About') },
    // { label: 'Contact', action: () => this.navigate('Contact') }
  ];

  navigate(section: string): void {
    console.log('Navigate to', section);
  }
}
