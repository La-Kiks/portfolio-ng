import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectLoader } from '../../../components/project-loader/project-loader';

@Component({
  selector: 'app-about',
  imports: [CommonModule, ProjectLoader],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {
  showProjectLoader: boolean = true;

  navItems = [
    { label: 'À PROPOS', action: () => this.navigate('About') },
  ];

  navigate(section: string): void {
    console.log('Navigate to', section);
  }

  onProjectLoaderComplete(): void {
    this.showProjectLoader = false;
  }
}
