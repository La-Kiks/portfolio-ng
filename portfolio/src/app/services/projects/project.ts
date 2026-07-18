import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
  link?: string;
  github?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private http = inject(HttpClient);

  private projectsJsonUrl = '/files/projects.json';

  getProjectBySlug(slug: string): Observable<Project | undefined> {
    return this.loadProjects().pipe(map((projects) => projects.find((p) => p.slug === slug)));
  }

  getAllProjects(): Observable<Project[]> {
    return this.loadProjects();
  }

  private loadProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.projectsJsonUrl);
  }
}
