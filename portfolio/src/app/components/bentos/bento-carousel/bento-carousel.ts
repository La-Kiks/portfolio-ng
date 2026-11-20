import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project, ProjectService } from '../../../services/projects/project';

export interface CarouselProject {
  id: string;
  title: string;
  description: string;
  poster: string;
  video: string;
  route: string;
}

@Component({
  selector: 'app-bento-carousel',
  imports: [RouterLink],
  templateUrl: './bento-carousel.html',
  styleUrl: './bento-carousel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BentoCarousel implements OnInit {
  private readonly projectService = inject(ProjectService);

  readonly projects = signal<CarouselProject[]>([]);
  readonly currentIndex = signal(0);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  private readonly preview = viewChild<ElementRef<HTMLVideoElement>>('preview');

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
            poster: project.video.posterLandscape,
            video: project.video.landscapeLoop,
            route: `/projects/${project.slug}`,
          })),
        );
        this.isLoading.set(false);
        this.warmUpPosters();
      },
      error: () => {
        this.isLoading.set(false);
        this.hasError.set(true);
      },
    });
  }

  // Browser pre-fetches the non-visible slides at low priority so swapping feels instant.
  private warmUpPosters(): void {
    this.projects()
      .slice(1)
      .forEach(project => {
        const img = new Image();
        img.fetchPriority = 'low';
        img.src = project.poster;
      });
  }

  previousProject(): void {
    const count = this.projects().length;
    if (count === 0) return;
    this.stopPreview();
    this.currentIndex.update(index => (index - 1 + count) % count);
  }

  nextProject(): void {
    const count = this.projects().length;
    if (count === 0) return;
    this.stopPreview();
    this.currentIndex.update(index => (index + 1) % count);
  }

  goToSlide(index: number): void {
    this.stopPreview();
    this.currentIndex.set(index);
  }

  playPreview(): void {
    const video = this.preview()?.nativeElement;
    if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // play() rejects when interrupted by pause() or blocked by the browser: the poster stays.
    video.play().catch(() => undefined);
  }

  stopPreview(): void {
    const video = this.preview()?.nativeElement;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }
}
