import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import { BentoNavbar, NavItem } from '../../../components/bentos/bento-navbar/bento-navbar';
import { ProjectService } from '../../../services/projects/project';

const MAX_TAGS = 3;

/** The card beside the wide first card is almost square, so a wide image would crop badly. */
function cardImage(images: string[], index: number): string {
  return index === 1 ? images[0] : (images[1] ?? images[0]);
}

interface ProjectCard {
  slug: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
}

@Component({
  selector: 'app-project-list',
  imports: [NgOptimizedImage, RouterLink, BentoNavbar],
  templateUrl: './project-list.html',
  styleUrl: './project-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectList {
  private readonly router = inject(Router);

  readonly navItems: NavItem[] = [
    { id: 1, label: 'Projets', current: true },
    {
      id: 2,
      label: 'À propos',
      primary: true,
      action: () => this.router.navigate(['/about']),
    },
  ];

  readonly loadError = signal(false);
  /** Undefined until the projects have loaded. */
  readonly projects = toSignal(
    inject(ProjectService)
      .getAllProjects()
      .pipe(
        map((projects): ProjectCard[] =>
          projects
            .filter((project) => project.images.length > 0)
            .map((project, index) => ({
              slug: project.slug,
              title: project.title,
              description: project.description,
              image: cardImage(project.images, index),
              tags: (project.stack ?? []).slice(0, MAX_TAGS),
            })),
        ),
        catchError(() => {
          this.loadError.set(true);
          return of<ProjectCard[]>([]);
        }),
      ),
  );
}
