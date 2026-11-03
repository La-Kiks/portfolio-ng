import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
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
const DESKTOP_ENTRANCE_MS = 1240;
const TABLET_ENTRANCE_MS = 970;

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

  readonly navItems: NavItem[] = [
    { id: 1, label: 'À PROPOS', action: () => this.router.navigate(['/about']) },
  ];

  readonly playEntrance = inject(EntranceService).consume();
  /** True while bentos are sliding in; drives overflow clipping in landing.scss. */
  readonly entering = signal(false);

  constructor() {
    const duration = this.playEntrance ? entranceDuration() : 0;
    if (duration > 0) {
      this.entering.set(true);
      const timer = setTimeout(() => this.entering.set(false), duration);
      inject(DestroyRef).onDestroy(() => clearTimeout(timer));
    }
  }
}
