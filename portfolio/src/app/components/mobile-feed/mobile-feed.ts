import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import { BentoNavbar, NavItem } from '../bentos/bento-navbar/bento-navbar';
import { SOCIAL_LINKS, SocialLink, isExternalLink } from '../bentos/bento-social/social-links';
import { ProjectService } from '../../services/projects/project';
import { FeedPosition } from '../../services/feed-position/feed-position';
import { FeedSound } from '../../services/feed-sound/feed-sound';

/** Intro photo; swap for a larger portrait version when available. */
export const INTRO_PHOTO = 'images/profile-pic-ki-small.webp';

interface FeedProject {
  slug: string;
  title: string;
  description: string;
  poster: string;
  video: string;
}

/** `navigator.connection` (Network Information API) is not in lib.dom. */
type NavigatorWithConnection = Navigator & { connection?: { saveData?: boolean } };

function isAutoplayAllowed(): boolean {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = (navigator as NavigatorWithConnection).connection?.saveData === true;
  return !reduceMotion && !saveData;
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
  readonly socialLinks = SOCIAL_LINKS;

  readonly loadError = signal(false);
  readonly projects = toSignal(
    inject(ProjectService)
      .getAllProjects()
      .pipe(
        map((projects): FeedProject[] =>
          projects.map((project) => ({
            slug: project.slug,
            title: project.title,
            description: project.description,
            poster: project.video.posterVertical,
            video: project.video.vertical,
          })),
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
  /** Screen whose description is unfolded; folds again when the active screen changes. */
  readonly expandedScreen = linkedSignal<number, number | null>({
    source: this.activeIndex,
    computation: () => null,
  });
  /** True once the intro screen is less than half visible. */
  readonly pastIntro = signal(false);
  /** Screen whose reel is currently playing, if any. */
  readonly playingScreen = signal<number | null>(null);

  readonly sound = inject(FeedSound);

  private readonly feed = viewChild.required<ElementRef<HTMLElement>>('feed');
  private readonly screens = viewChildren<ElementRef<HTMLElement>>('screen');
  /** One reel per project, in order: reel i belongs to screen i + 1. */
  private readonly reels = viewChildren<ElementRef<HTMLVideoElement>>('reel');
  /** Reduced motion and data saving both opt out of autoplay; read once. */
  private readonly autoplay = isAutoplayAllowed();
  private readonly position = inject(FeedPosition);
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
    // The active screen's reel plays, every other one pauses.
    afterRenderEffect(() => {
      const active = this.activeIndex();
      this.reels().forEach((reel, i) => {
        const video = reel.nativeElement;
        if (i + 1 === active && this.autoplay) {
          untracked(() => this.play(video));
        } else {
          video.pause();
        }
      });
    });
    // Returning from a project page: jump back to the screen the user left.
    afterNextRender(() => {
      const index = this.position.index;
      const target = index > 0 ? this.screens()[index] : undefined;
      if (target) {
        this.feed().nativeElement.scrollTo({
          top: target.nativeElement.offsetTop,
          behavior: 'auto',
        });
        this.activeIndex.set(index);
        this.pastIntro.set(true);
      }
    });
    inject(DestroyRef).onDestroy(() => {
      this.observer?.disconnect();
      this.position.index = this.activeIndex();
      for (const reel of this.reels()) {
        reel.nativeElement.pause();
      }
    });
  }

  /** Preload only what the user is about to see: the active reel and the next one. */
  reelPreload(screen: number): 'metadata' | 'none' {
    const active = this.activeIndex();
    return screen === active || screen === active + 1 ? 'metadata' : 'none';
  }

  toggleSound(): void {
    this.sound.toggle();
    // Apply within the tap itself: browsers only accept unmuting from a user gesture.
    const muted = !this.sound.on();
    for (const reel of this.reels()) {
      reel.nativeElement.muted = muted;
    }
  }

  togglePlayback(screen: number): void {
    const video = this.reels()[screen - 1]?.nativeElement;
    if (!video) return;
    if (video.paused) {
      this.play(video);
    } else {
      video.pause();
    }
  }

  onReelPause(screen: number): void {
    this.playingScreen.update((playing) => (playing === screen ? null : playing));
  }

  toggleDescription(index: number): void {
    this.expandedScreen.update((current) => (current === index ? null : index));
  }

  isExternal(link: SocialLink): boolean {
    return isExternalLink(link);
  }

  backToTop(): void {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.feed().nativeElement.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }

  /** Unmuted play() can be refused (no user gesture yet): fall back to muted playback. */
  private play(video: HTMLVideoElement): void {
    video.play().catch((error: unknown) => {
      // Other rejections (pause() interrupting play()) just leave the poster in place.
      if (!video.muted && error instanceof DOMException && error.name === 'NotAllowedError') {
        this.sound.mute();
        video.muted = true;
        // The user may have scrolled on while play() was pending: never revive a stale reel.
        if (this.reels()[this.activeIndex() - 1]?.nativeElement === video) {
          video.play().catch(() => undefined);
        }
      }
    });
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
