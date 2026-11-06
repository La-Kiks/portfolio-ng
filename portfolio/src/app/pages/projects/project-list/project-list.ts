import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import { BentoNavbar, NavItem } from '../../../components/bentos/bento-navbar/bento-navbar';
import { ProjectService } from '../../../services/projects/project';

const MAX_TAGS = 3;
const MAX_FIT_CARDS = 5;

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
          projects.flatMap((project) => {
            const image = project.images[1] ?? project.images[0];
            return image
              ? [
                  {
                    slug: project.slug,
                    title: project.title,
                    description: project.description,
                    image,
                    tags: (project.stack ?? []).slice(0, MAX_TAGS),
                  },
                ]
              : [];
          }),
        ),
        catchError(() => {
          this.loadError.set(true);
          return of<ProjectCard[]>([]);
        }),
      ),
  );

  /** Five cards fill two rows exactly; more fall back to the scrolling layout. */
  readonly fitsViewport = computed(() => (this.projects()?.length ?? 0) <= MAX_FIT_CARDS);
}
