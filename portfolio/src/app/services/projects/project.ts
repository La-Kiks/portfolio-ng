import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, shareReplay } from 'rxjs';

export interface ProjectVideo {
  landscape: string;
  landscapeLoop: string;
  vertical: string;
  posterLandscape: string;
  posterVertical: string;
  duration: string; // ISO 8601
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription?: string;
  context?: string;
  objectives?: string;
  stack?: string[];
  skills?: string[];
  results?: string;
  improvements?: string[];
  images: string[];
  video: ProjectVideo;
  link?: string;
  github?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private readonly http = inject(HttpClient);

  private readonly projects$: Observable<Project[]> = this.http
    .get<Project[]>('files/projects.json')
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  getAllProjects(): Observable<Project[]> {
    return this.projects$;
  }

  getProjectBySlug(slug: string): Observable<Project | undefined> {
    return this.projects$.pipe(map(projects => projects.find(p => p.slug === slug)));
  }
}
