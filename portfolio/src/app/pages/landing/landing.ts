import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Loader } from '../../components/loader/loader';
import { BentoNavbar, NavItem } from '../../components/bentos/bento-navbar/bento-navbar';
import { BentoCarousel } from '../../components/bentos/bento-carousel/bento-carousel';
import { BentoTitleDescription } from '../../components/bentos/bento-title-description/bento-title-description';
import { BentoTitle } from '../../components/bentos/bento-title/bento-title';
import { BentoDescription } from '../../components/bentos/bento-description/bento-description';
import { BentoProfilePicture } from '../../components/bentos/bento-profile-picture/bento-profile-picture';
import { BentoSocial } from '../../components/bentos/bento-social/bento-social';
import { EntranceService } from '../../services/entrance/entrance';

/** Total entrance length (last delay + duration) — must match landing.scss. */
const DESKTOP_ENTRANCE_MS = 1680; // 3 × 260ms stagger + 900ms slide
const TABLET_ENTRANCE_MS = 1300; // 3 × 200ms stagger + 700ms slide
/** Longest we hold the bentos back waiting for the hero images. */
export const IMAGE_WAIT_MAX_MS = 1200;
/** Images the entrance waits for, so they don't pop in mid-slide. */
const HERO_IMAGES = ['.grid-profile img', '.grid-carousel img'];

function entranceDuration(): number {
  if (window.matchMedia('(min-width: 1024px)').matches) {
    return DESKTOP_ENTRANCE_MS;
  }
  if (window.matchMedia('(min-width: 600px)').matches) {
    return TABLET_ENTRANCE_MS;
  }
  return 0; // mobile: the loader handles it, no entrance animation
}

@Component({
  selector: 'app-landing',
  imports: [
    Loader,
    BentoNavbar,
    BentoCarousel,
    BentoTitleDescription,
    BentoTitle,
    BentoDescription,
    BentoProfilePicture,
    BentoSocial,
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {
  private readonly router = inject(Router);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;

  readonly navItems: NavItem[] = [
    { id: 1, label: 'À PROPOS', action: () => this.router.navigate(['/about']) },
  ];

  readonly playEntrance = inject(EntranceService).consume();
  /** True from creation until the entrance has finished; drives overflow clipping. */
  readonly entering = signal(false);
  /** False while bentos are held at their start positions waiting for hero images. */
  readonly ready = signal(false);

  constructor() {
    const duration = this.playEntrance ? entranceDuration() : 0;
    if (duration <= 0) {
      return;
    }

    this.entering.set(true);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const onImage = (): void => {
      if (this.heroImagesLoaded()) {
        start();
      }
    };
    const stopListening = (): void => {
      this.host.removeEventListener('load', onImage, true);
      this.host.removeEventListener('error', onImage, true);
    };
    const start = (): void => {
      if (this.ready()) {
        return;
      }
      stopListening();
      this.ready.set(true);
      timers.push(setTimeout(() => this.entering.set(false), duration));
    };

    // load/error don't bubble, so listen in the capture phase.
    this.host.addEventListener('load', onImage, true);
    this.host.addEventListener('error', onImage, true);
    timers.push(setTimeout(start, IMAGE_WAIT_MAX_MS));

    inject(DestroyRef).onDestroy(() => {
      stopListening();
      timers.forEach(clearTimeout);
    });
  }

  private heroImagesLoaded(): boolean {
    return HERO_IMAGES.every(
      (selector) => this.host.querySelector<HTMLImageElement>(selector)?.complete === true,
    );
  }
}
