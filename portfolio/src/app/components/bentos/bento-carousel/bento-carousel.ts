import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Project, ProjectService } from '../../../services/projects/project';

export interface CarouselProject {
  id: string;
  title: string;
  description: string;
  image: string;
  route: string;
}

@Component({
  selector: 'app-bento-carousel',
  imports: [CommonModule],
  templateUrl: './bento-carousel.html',
  styleUrl: './bento-carousel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BentoCarousel implements OnInit {
  @Input() projects: CarouselProject[] = [];

  currentIndex: number = 0;
  isLoading: boolean = true;

  constructor(
    private router: Router,
    private projectService: ProjectService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if (this.projects.length === 0) {
      this.loadProjects();
    } else {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  private loadProjects(): void {
    this.projectService.getAllProjects().subscribe({
      next: (projects: Project[]) => {
        this.projects = projects.map(project => ({
          id: project.id,
          title: project.title,
          description: project.description,
          image: project.images[0],
          route: `/projects/${project.slug}`
        }));
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get currentProject(): CarouselProject {
    if (!this.projects || this.projects.length === 0) {
      return {} as CarouselProject;
    }
    return this.projects[this.currentIndex];
  }

  previousProject(): void {
    this.currentIndex = (this.currentIndex - 1 + this.projects.length) % this.projects.length;
  }

  nextProject(): void {
    this.currentIndex = (this.currentIndex + 1) % this.projects.length;
  }

  goToProject(): void {
    if (this.currentProject.route) {
      this.router.navigate([this.currentProject.route]);
    }
  }

  goToSlide(index: number): void {
    this.currentIndex = index;
  }
}
