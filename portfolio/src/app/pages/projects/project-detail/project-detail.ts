import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { AsyncPipe, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { catchError, map, Observable, of, startWith, switchMap, tap } from 'rxjs';
import { Project, ProjectService } from '../../../services/projects/project';
import { VideoSeo } from '../../../services/video-seo/video-seo';
import { ProjectLoader } from '../../../components/project-loader/project-loader';
import { MOBILE_QUERY } from '../../../components/loader/loader';

interface GalleryImage {
  src: string;
  alt: string;
}

interface ProjectState {
  project: Project | null;
  gallery: GalleryImage[];
  isLoading: boolean;
  error: string | null;
}

/** "images/sport-event/01b-accueil-haut-de-page.webp" → "accueil haut de page" */
function captureName(path: string): string {
  const file = path.slice(path.lastIndexOf('/') + 1);
  return file
    .replace(/\.[^.]+$/, '')
    .replace(/^\d+[a-z]?-/, '')
    .replace(/-/g, ' ');
}

function galleryOf(project: Project): GalleryImage[] {
  return project.images.map((src) => ({ src, alt: `${project.title} — ${captureName(src)}` }));
}

@Component({
  selector: 'app-project-detail',
  imports: [AsyncPipe, NgOptimizedImage, RouterLink, ProjectLoader],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly videoSeo = inject(VideoSeo);

  readonly showProjectLoader = signal(true);

  private readonly mobileQuery = window.matchMedia(MOBILE_QUERY);
  /** Below 600px the hero plays the vertical cut. */
  readonly isMobile = signal(this.mobileQuery.matches);

  readonly projectState$: Observable<ProjectState> = this.route.params.pipe(
    switchMap((params) =>
      this.projectService.getProjectBySlug(params['slug']).pipe(
        map((project) => ({
          project: project ?? null,
          gallery: project ? galleryOf(project) : [],
          isLoading: false,
          error: project ? null : 'Projet introuvable',
        })),
        tap((state) => {
          if (state.project) {
            this.titleService.setTitle(`${state.project.title} — Kilian Audroin`);
            this.metaService.updateTag({
              name: 'description',
              content: state.project.description,
            });
            this.videoSeo.apply(state.project);
          } else {
            this.videoSeo.clear();
          }
        }),
        startWith({ project: null, gallery: [], isLoading: true, error: null }),
        catchError(() => {
          this.videoSeo.clear();
          return of({
            project: null,
            gallery: [],
            isLoading: false,
            error: 'Erreur lors du chargement du projet',
          });
        }),
      ),
    ),
  );

  constructor() {
    const destroyRef = inject(DestroyRef);
    const onMobileChange = (event: MediaQueryListEvent): void => this.isMobile.set(event.matches);
    this.mobileQuery.addEventListener('change', onMobileChange);
    destroyRef.onDestroy(() => {
      this.mobileQuery.removeEventListener('change', onMobileChange);
      this.videoSeo.clear();
    });
  }

  onProjectLoaderComplete(): void {
    this.showProjectLoader.set(false);
  }
}
