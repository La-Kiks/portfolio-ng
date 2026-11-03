import { SOCIAL_LINKS, isExternalLink } from './social-links';

describe('social links', () => {
  it('lists Contact, LinkedIn, X and GitHub in order', () => {
    expect(SOCIAL_LINKS.map((link) => link.label)).toEqual(['Contact', 'LinkedIn', 'X', 'GitHub']);
    expect(SOCIAL_LINKS[0].url).toBe('mailto:kilian.audroin@gmail.com');
  });

  it('treats mailto links as internal and https links as external', () => {
    expect(isExternalLink(SOCIAL_LINKS[0])).toBe(false);
    expect(isExternalLink(SOCIAL_LINKS[1])).toBe(true);
  });
});
