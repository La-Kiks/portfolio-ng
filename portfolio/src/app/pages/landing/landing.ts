import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BentoNavbar } from '../../components/bentos/bento-navbar/bento-navbar';
import { BentoCarousel, CarouselProject } from '../../components/bentos/bento-carousel/bento-carousel';
import { BentoTitleDescription } from '../../components/bentos/bento-title-description/bento-title-description';
import { BentoProfilePicture } from '../../components/bentos/bento-profile-picture/bento-profile-picture';
import { BentoSocial } from '../../components/bentos/bento-social/bento-social';

@Component({
  selector: 'app-landing',
  imports: [CommonModule, BentoNavbar, BentoCarousel, BentoTitleDescription, BentoProfilePicture, BentoSocial],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})

export class Landing {
  // Placeholder Navigation -- TODO : Edit or delete
  navItems = [
    { label: 'À PROPOS', action: () => this.navigate('About') },
    // { label: 'Contact', action: () => this.navigate('Contact') }
  ];

  projects: CarouselProject[] = [
    {
      id: '1',
      title: 'E-Commerce Platform',
      image: '/images/profile-pic-ki.jpg',
      route: '/project/1'
    },
    {
      id: '2',
      title: 'Dashboard Analytics',
      image: '/images/paris-stage-wide.jpg',
      route: '/project/2'
    },
    {
      id: '3',
      title: 'Mobile App Design',
      image: '/images/profile-pic-ki-lfl.png',
      route: '/project/3'
    }
  ];

  navigate(section: string): void {
    console.log('Navigate to', section);
  }


}
