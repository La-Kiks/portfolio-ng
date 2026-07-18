import {
  Component,
  Input,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  DOCUMENT,
  inject,
} from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BentoCarousel implements OnInit {
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private cdr = inject(ChangeDetectorRef);
  private document = inject<Document>(DOCUMENT);

  @Input() projects: CarouselProject[] = [];

  currentIndex = 0;
  isLoading = true;

  ngOnInit(): void {
    if (this.projects.length === 0) {
      this.loadProjects();
    } else {
      this.isLoading = false;
      this.preloadFirstImage();
      this.cdr.markForCheck();
    }
  }

  private loadProjects(): void {
    this.projectService.getAllProjects().subscribe({
      next: (projects: Project[]) => {
        this.projects = projects.map((project) => ({
          id: project.id,
          title: project.title,
          description: project.description,
          image: project.images[0],
          route: `/projects/${project.slug}`,
        }));
        this.isLoading = false;
        this.preloadImages();
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private preloadImages(): void {
    this.preloadFirstImage();

    this.projects.slice(1).forEach((project) => {
      const img = new Image();
      img.fetchPriority = 'low';
      img.src = project.image;
    });
  }

  private preloadFirstImage(): void {
    if (this.projects.length === 0) return;

    const firstImage = this.projects[0].image;

    const link = this.document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = firstImage;
    link.fetchPriority = 'high';
    this.document.head.appendChild(link);

    const img = new Image();
    img.fetchPriority = 'high';
    img.src = firstImage;
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
