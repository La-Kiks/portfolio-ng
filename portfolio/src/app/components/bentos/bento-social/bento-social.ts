import { Component, Input } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';

export interface SocialLink {
  label: string;
  icon: string;
  url: string;
  action?: () => void;
}

@Component({
  selector: 'app-bento-social',
  imports: [CommonModule, NgClass],
  templateUrl: './bento-social.html',
  styleUrl: './bento-social.scss',
})
export class BentoSocial {
  @Input() socialLinks: SocialLink[] = [
    {
      label: 'Contact',
      icon: 'fas fa-envelope',
      url: 'mailto:kilian.audroin@gmail.com'
    },
    {
      label: 'LinkedIn',
      icon: 'fab fa-linkedin',
      url: 'https://www.linkedin.com/in/kilian-audroin/'
    },
    {
      label: 'X',
      icon: 'fab fa-x-twitter',
      url: 'https://x.com/Kiki_coaching'
    },
    {
      label: 'GitHub',
      icon: 'fab fa-github',
      url: 'https://github.com/La-Kiks'
    }
  ];

  handleClick(link: SocialLink): void {
    if (link.action) {
      link.action();
    } else if (link.url) {
      window.open(link.url, '_blank');
    }
  }
}
