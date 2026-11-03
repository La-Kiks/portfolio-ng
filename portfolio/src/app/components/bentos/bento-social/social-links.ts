export interface SocialLink {
  label: string;
  icon: string;
  url: string;
}

/** Social/contact links shared by the desktop footer bento and the mobile feed. */
export const SOCIAL_LINKS: readonly SocialLink[] = [
  { label: 'Contact', icon: 'fas fa-envelope', url: 'mailto:kilian.audroin@gmail.com' },
  {
    label: 'LinkedIn',
    icon: 'fab fa-linkedin',
    url: 'https://www.linkedin.com/in/kilian-audroin/',
  },
  { label: 'X', icon: 'fab fa-x-twitter', url: 'https://x.com/Kiki_coaching' },
  { label: 'GitHub', icon: 'fab fa-github', url: 'https://github.com/La-Kiks' },
];

export function isExternalLink(link: SocialLink): boolean {
  return !link.url.startsWith('mailto:');
}
