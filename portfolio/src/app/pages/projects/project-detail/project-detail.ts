import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { catchError, map, Observable, of, startWith, switchMap, tap } from 'rxjs';
import { Project, ProjectService } from '../../../services/projects/project';
import { ProjectLoader } from '../../../components/project-loader/project-loader';

interface ProjectState {
  project: Project | null;
  isLoading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-project-detail',
  imports: [AsyncPipe, RouterLink, ProjectLoader],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  readonly showProjectLoader = signal(true);

  readonly projectState$: Observable<ProjectState> = this.route.params.pipe(
    switchMap(params =>
      this.projectService.getProjectBySlug(params['slug']).pipe(
        map(project => ({
          project: project ?? null,
          isLoading: false,
          error: project ? null : 'Project not found',
        })),
        tap(state => {
          if (state.project) {
            this.titleService.setTitle(`${state.project.title} — Kilian Audroin`);
            this.metaService.updateTag({
              name: 'description',
              content: state.project.description,
            });
          }
        }),
        startWith({ project: null, isLoading: true, error: null }),
        catchError(() =>
          of({ project: null, isLoading: false, error: 'Error loading project' }),
        ),
      ),
    ),
  );

  onProjectLoaderComplete(): void {
    this.showProjectLoader.set(false);
  }
}
