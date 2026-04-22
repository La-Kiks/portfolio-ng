import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProjectService, Project } from '../../../services/projects/project';
import { ProjectLoader } from '../../../components/project-loader/project-loader';
import { Observable, switchMap, map, startWith, catchError, of } from 'rxjs';

interface ProjectState {
  project: Project | null;
  isLoading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-project-detail',
  imports: [CommonModule, ProjectLoader],
  templateUrl: './project-detail.html',
  styleUrls: ['./project-detail.scss']
})

export class ProjectDetail implements OnInit {
  projectState$: Observable<ProjectState>;
  showProjectLoader: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService
  ) {
    this.projectState$ = this.route.params.pipe(
      switchMap(params => {
        const slug = params['slug'];
        return this.projectService.getProjectBySlug(slug).pipe(
          map(project => ({
            project: project || null,
            isLoading: false,
            error: project ? null : 'Project not found'
          })),
          startWith({ project: null, isLoading: true, error: null }),
          catchError(err => of({
            project: null,
            isLoading: false,
            error: 'Error loading project'
          }))
        );
      })
    );
  }

  ngOnInit(): void { }

  onProjectLoaderComplete(): void {
    this.showProjectLoader = false;
  }
}