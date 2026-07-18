import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Loader } from '../../components/loader/loader';
import { BentoNavbar, NavItem } from '../../components/bentos/bento-navbar/bento-navbar';
import { BentoCarousel } from '../../components/bentos/bento-carousel/bento-carousel';
import { BentoTitleDescription } from '../../components/bentos/bento-title-description/bento-title-description';
import { BentoTitle } from '../../components/bentos/bento-title/bento-title';
import { BentoDescription } from '../../components/bentos/bento-description/bento-description';
import { BentoProfilePicture } from '../../components/bentos/bento-profile-picture/bento-profile-picture';
import { BentoSocial } from '../../components/bentos/bento-social/bento-social';

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
}
