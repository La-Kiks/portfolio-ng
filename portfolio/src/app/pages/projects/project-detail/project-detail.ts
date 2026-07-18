import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { ProjectService, Project } from '../../../services/projects/project';
import { ProjectLoader } from '../../../components/project-loader/project-loader';
import { Observable, switchMap, map, startWith, catchError, of, tap } from 'rxjs';

interface ProjectState {
  project: Project | null;
  isLoading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-project-detail',
  imports: [CommonModule, RouterLink, ProjectLoader],
  templateUrl: './project-detail.html',
  styleUrls: ['./project-detail.scss'],
})
export class ProjectDetail {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  projectState$: Observable<ProjectState>;
  showProjectLoader = true;

  constructor() {
    this.projectState$ = this.route.params.pipe(
      switchMap((params) => {
        const slug = params['slug'];
        return this.projectService.getProjectBySlug(slug).pipe(
          map((project) => ({
            project: project || null,
            isLoading: false,
            error: project ? null : 'Project not found',
          })),
          tap((state) => {
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
            of({
              project: null,
              isLoading: false,
              error: 'Error loading project',
            }),
          ),
        );
      }),
    );
  }

  onProjectLoaderComplete(): void {
    this.showProjectLoader = false;
  }
}
