import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Loader } from '../../components/loader/loader';
import { BentoNavbar } from '../../components/bentos/bento-navbar/bento-navbar';
import { BentoCarousel, CarouselProject } from '../../components/bentos/bento-carousel/bento-carousel';
import { BentoTitleDescription } from '../../components/bentos/bento-title-description/bento-title-description';
import { BentoTitle } from '../../components/bentos/bento-title/bento-title';
import { BentoDescription } from '../../components/bentos/bento-description/bento-description';
import { BentoProfilePicture } from '../../components/bentos/bento-profile-picture/bento-profile-picture';
import { BentoSocial } from '../../components/bentos/bento-social/bento-social';

@Component({
  selector: 'app-landing',
  imports: [CommonModule, Loader, BentoNavbar, BentoCarousel, BentoTitleDescription, BentoTitle, BentoDescription, BentoProfilePicture, BentoSocial],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})

export class Landing {
  // Placeholder Navigation -- TODO : Edit or delete
  navItems = [
    { label: 'À PROPOS', action: () => this.navigate('About') },
  ];

  projects: CarouselProject[] = [];

  onLoadingComplete(): void {
    console.log('Loading complete, page revealed!');
  }

  // Placeholder Navigation -- TODO : Edit or delete
  navigate(section: string): void {
    console.log('Navigate to', section);
  }


}
