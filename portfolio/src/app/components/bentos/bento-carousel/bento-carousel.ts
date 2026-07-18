import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
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
  imports: [NgOptimizedImage],
  templateUrl: './bento-carousel.html',
  styleUrl: './bento-carousel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BentoCarousel implements OnInit {
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);

  readonly projects = signal<CarouselProject[]>([]);
  readonly currentIndex = signal(0);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  readonly currentProject = computed<CarouselProject | undefined>(
    () => this.projects()[this.currentIndex()],
  );

  ngOnInit(): void {
    this.projectService.getAllProjects().subscribe({
      next: (projects: Project[]) => {
        this.projects.set(
          projects.map(project => ({
            id: project.id,
            title: project.title,
            description: project.description,
            image: project.images[0],
            route: `/projects/${project.slug}`,
          })),
        );
        this.isLoading.set(false);
        this.warmUpImages();
      },
      error: () => {
        this.isLoading.set(false);
        this.hasError.set(true);
      },
    });
  }

  // Browser pre-fetches the non-visible slides at low priority so swapping feels instant.
  private warmUpImages(): void {
    this.projects()
      .slice(1)
      .forEach(project => {
        const img = new Image();
        img.fetchPriority = 'low';
        img.src = project.image;
      });
  }

  previousProject(): void {
    const count = this.projects().length;
    if (count === 0) return;
    this.currentIndex.update(index => (index - 1 + count) % count);
  }

  nextProject(): void {
    const count = this.projects().length;
    if (count === 0) return;
    this.currentIndex.update(index => (index + 1) % count);
  }

  goToProject(): void {
    const project = this.currentProject();
    if (project) {
      this.router.navigate([project.route]);
    }
  }

  goToSlide(index: number): void {
    this.currentIndex.set(index);
  }
}
