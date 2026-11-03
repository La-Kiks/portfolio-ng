import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { SOCIAL_LINKS, SocialLink, isExternalLink } from './social-links';

export type { SocialLink } from './social-links';

@Component({
  selector: 'app-bento-social',
  imports: [NgClass],
  templateUrl: './bento-social.html',
  styleUrl: './bento-social.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BentoSocial {
  readonly socialLinks = input<readonly SocialLink[]>(SOCIAL_LINKS);

  isExternal(link: SocialLink): boolean {
    return isExternalLink(link);
  }
}
