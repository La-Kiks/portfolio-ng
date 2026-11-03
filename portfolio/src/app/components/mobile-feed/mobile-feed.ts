import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import { BentoNavbar, NavItem } from '../bentos/bento-navbar/bento-navbar';
import { SOCIAL_LINKS, isExternalLink } from '../bentos/bento-social/social-links';
import { ProjectService } from '../../services/projects/project';

/** Intro photo; swap for a larger portrait version when available. */
export const INTRO_PHOTO = '/images/profile-pic-ki-small.webp';

interface FeedProject {
  slug: string;
  title: string;
  description: string;
  image: string;
}

@Component({
  selector: 'app-mobile-feed',
  imports: [NgOptimizedImage, RouterLink, BentoNavbar],
  templateUrl: './mobile-feed.html',
  styleUrl: './mobile-feed.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileFeed {
  readonly navItems = input<NavItem[]>([]);

  readonly introPhoto = INTRO_PHOTO;
  readonly introDescription =
    "Développeur full-stack, j'accompagne vos projets web en Symfony/PHP ou .NET/Angular. Curieux et exigeant, je livre un code fiable et évolutif.";
  readonly mailLinks = SOCIAL_LINKS.filter((link) => !isExternalLink(link));
  readonly iconLinks = SOCIAL_LINKS.filter(isExternalLink);

  readonly loadError = signal(false);
  readonly projects = toSignal(
    inject(ProjectService)
      .getAllProjects()
      .pipe(
        map((projects): FeedProject[] =>
          projects.flatMap((project) => {
            const [image] = project.images;
            return image
              ? [
                  {
                    slug: project.slug,
                    title: project.title,
                    description: project.description,
                    image,
                  },
                ]
              : [];
          }),
        ),
        catchError(() => {
          this.loadError.set(true);
          return of<FeedProject[]>([]);
        }),
      ),
    { initialValue: [] },
  );

  /** Intro + (projects or one error screen) + contact. */
  readonly screenCount = computed(() => 2 + (this.loadError() ? 1 : this.projects().length));
  readonly dots = computed(() => Array.from({ length: this.screenCount() }, (_, i) => i));
  readonly activeIndex = signal(0);
  /** True once the intro screen is less than half visible. */
  readonly pastIntro = signal(false);

  private readonly feed = viewChild.required<ElementRef<HTMLElement>>('feed');
  private readonly screens = viewChildren<ElementRef<HTMLElement>>('screen');
  private observer?: IntersectionObserver;

  constructor() {
    // Re-observe whenever the set of screens changes (projects arrive after the first render).
    afterRenderEffect(() => {
      const screens = this.screens();
      this.observer?.disconnect();
      this.observer = new IntersectionObserver((entries) => this.onIntersect(entries), {
        root: this.feed().nativeElement,
        threshold: 0.5,
      });
      for (const screen of screens) {
        this.observer.observe(screen.nativeElement);
      }
    });
    inject(DestroyRef).onDestroy(() => this.observer?.disconnect());
  }

  backToTop(): void {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.feed().nativeElement.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }

  private onIntersect(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      const index = Number((entry.target as HTMLElement).dataset['screen']);
      const visible = entry.intersectionRatio >= 0.5;
      if (index === 0) {
        this.pastIntro.set(!visible);
      }
      if (visible) {
        this.activeIndex.set(index);
      }
    }
  }
}
