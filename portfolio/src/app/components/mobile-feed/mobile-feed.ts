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
  /** The sound button only makes sense where a reel is playing. */
  readonly onProjectScreen = computed(() => {
    const index = this.activeIndex();
    return !this.loadError() && index >= 1 && index <= this.projects().length;
  });

  readonly sound = inject(FeedSound);

  private readonly feed = viewChild.required<ElementRef<HTMLElement>>('feed');
  private readonly screens = viewChildren<ElementRef<HTMLElement>>('screen');
  /** One reel per project, in order: reel i belongs to screen i + 1. */
  private readonly reels = viewChildren<ElementRef<HTMLVideoElement>>('reel');
  /** Reduced motion and data saving both opt out of autoplay; read once. */
  private readonly autoplay = isAutoplayAllowed();
  private readonly position = inject(FeedPosition);
  private observer?: IntersectionObserver;
  /**
   * The muted state the feed itself last gave each reel. A volumechange that leaves a reel in
   * that state is our own doing (browsers queue the event, so it may arrive late), not the user's.
   */
  private readonly assignedMuted = new WeakMap<HTMLVideoElement, boolean>();
  /** Removes the one-shot "unmute on first gesture" listeners, while they are armed. */
  private disarmGesture?: () => void;

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
      }
    });
    inject(DestroyRef).onDestroy(() => {
      this.observer?.disconnect();
      this.disarmGesture?.();
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

  /** Applied inside the tap itself: browsers only accept unmuting from a user gesture. */
  toggleSound(): void {
    const active = this.activeReel();
    if (this.sound.on() && active?.muted) {
      // Sound is wanted but the autoplay fallback silenced this reel: the tap unlocks it.
      this.disarmGesture?.();
      this.setMuted(active, false);
      return;
    }
    this.sound.toggle();
    this.applySound();
  }

  /** Native mute (or volume at zero) on the active reel is the user's sound choice. */
  onVolumeChange(event: Event): void {
    const video = event.target as HTMLVideoElement;
    if (video !== this.activeReel()) return;
    if (video.muted === this.assignedMuted.get(video) && video.volume > 0) return;
    this.sound.set(!(video.muted || video.volume === 0));
    this.applySound();
  }

  /** Bring every reel in line with the sound intent. */
  private applySound(): void {
    const muted = !this.sound.on();
    for (const reel of this.reels()) {
      this.setMuted(reel.nativeElement, muted);
    }
  }

  private setMuted(video: HTMLVideoElement, muted: boolean): void {
    this.assignedMuted.set(video, muted);
    video.muted = muted;
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

  private activeReel(): HTMLVideoElement | undefined {
    return this.reels()[this.activeIndex() - 1]?.nativeElement;
  }

  /**
   * Unmuted play() is refused until the user's first tap/key (a scroll does not count):
   * play muted meanwhile, keep the sound intent, and unmute on that first gesture.
   */
  private play(video: HTMLVideoElement): void {
    // The fallback may have muted this reel earlier: follow the current intent again.
    this.setMuted(video, !this.sound.on());
    video.play().catch((error: unknown) => {
      // Other rejections (pause() interrupting play()) just leave the poster in place.
      if (!video.muted && error instanceof DOMException && error.name === 'NotAllowedError') {
        this.setMuted(video, true);
        this.armUnmuteOnGesture();
        // The user may have scrolled on while play() was pending: never revive a stale reel.
        if (this.activeReel() === video) {
          video.play().catch(() => undefined);
        }
      }
    });
  }

  /**
   * One-shot: the first click or key press in the feed unmutes the active reel, inside that
   * gesture as browsers require. Bubble phase, so a tap on the native mute button has already
   * been applied (and is not undone) by the time this runs.
   */
  private armUnmuteOnGesture(): void {
    if (this.disarmGesture) return;
    const feed = this.feed().nativeElement;
    const onGesture = (event: Event): void => {
      this.disarmGesture?.();
      const video = this.activeReel();
      if (!video || !this.sound.on()) return;
      this.setMuted(video, false);
      // A gesture on the reel itself belongs to its native controls (e.g. pause): don't override it.
      if (event.target !== video) {
        this.play(video);
      }
    };
    const events = ['click', 'keydown'] as const;
    for (const type of events) {
      feed.addEventListener(type, onGesture);
    }
    this.disarmGesture = () => {
      for (const type of events) {
        feed.removeEventListener(type, onGesture);
      }
      this.disarmGesture = undefined;
    };
  }

  private onIntersect(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      const index = Number((entry.target as HTMLElement).dataset['screen']);
      const visible = entry.intersectionRatio >= 0.5;
      if (visible) {
        this.activeIndex.set(index);
      }
    }
  }
}
