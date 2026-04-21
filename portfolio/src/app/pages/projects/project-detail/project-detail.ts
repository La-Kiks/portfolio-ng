import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProjectService, Project } from '../../../services/projects/project';

@Component({
  selector: 'app-project-detail',
  imports: [CommonModule],
  templateUrl: './project-detail.html',
  styleUrls: ['./project-detail.scss']
})

export class ProjectDetail implements OnInit {
  project: Project | undefined;
  isLoading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      this.loadProject(slug);
    });
  }

  private loadProject(slug: string): void {
    this.isLoading = true;
    this.error = null;

    this.projectService.getProjectBySlug(slug).subscribe({
      next: (project) => {
        if (project) {
          this.project = project;
        } else {
          this.error = 'Project not found';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error loading project';
        this.isLoading = false;
      }
    });
  }
}