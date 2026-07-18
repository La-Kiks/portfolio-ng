import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectLoader } from '../../../components/project-loader/project-loader';

@Component({
  selector: 'app-about',
  imports: [CommonModule, RouterLink, ProjectLoader],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {
  showProjectLoader: boolean = true;

  onProjectLoaderComplete(): void {
    this.showProjectLoader = false;
  }
}
