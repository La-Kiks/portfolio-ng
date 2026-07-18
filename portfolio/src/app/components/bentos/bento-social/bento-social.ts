import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

export interface SocialLink {
  label: string;
  icon: string;
  url: string;
}

@Component({
  selector: 'app-bento-social',
  imports: [NgClass],
  templateUrl: './bento-social.html',
  styleUrl: './bento-social.scss',
})
export class BentoSocial {
  @Input() socialLinks: SocialLink[] = [
    {
      label: 'Contact',
      icon: 'fas fa-envelope',
      url: 'mailto:kilian.audroin@gmail.com',
    },
    {
      label: 'LinkedIn',
      icon: 'fab fa-linkedin',
      url: 'https://www.linkedin.com/in/kilian-audroin/',
    },
    {
      label: 'X',
      icon: 'fab fa-x-twitter',
      url: 'https://x.com/Kiki_coaching',
    },
    {
      label: 'GitHub',
      icon: 'fab fa-github',
      url: 'https://github.com/La-Kiks',
    },
  ];

  isExternal(link: SocialLink): boolean {
    return !link.url.startsWith('mailto:');
  }
}
