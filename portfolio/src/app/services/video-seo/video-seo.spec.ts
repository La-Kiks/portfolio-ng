import { TestBed } from '@angular/core/testing';
import { SITE_URL, VideoSeo } from './video-seo';
import { makeProject } from '../../../testing/project-fixture';

const SCRIPT_SELECTOR = 'script#project-video-ld';

function metaContent(selector: string): string | null {
  return document.head.querySelector(selector)?.getAttribute('content') ?? null;
}

describe('VideoSeo', () => {
  let seo: VideoSeo;

  beforeEach(() => {
    seo = TestBed.inject(VideoSeo);
  });

  afterEach(() => {
    seo.clear();
    document.head.querySelectorAll('link[rel="canonical"]').forEach((link) => link.remove());
    TestBed.resetTestingModule();
  });

  function canonicalHrefs(): (string | null)[] {
    return Array.from(document.head.querySelectorAll('link[rel="canonical"]')).map((link) =>
      link.getAttribute('href'),
    );
  }

  it('apply writes one VideoObject', () => {
    seo.apply(makeProject({ title: 'Sport Event', description: 'Une plateforme sportive' }));

    const scripts = document.querySelectorAll(SCRIPT_SELECTOR);
    expect(scripts.length).toBe(1);
    expect(scripts[0].getAttribute('type')).toBe('application/ld+json');
    const data = JSON.parse(scripts[0].textContent ?? '');
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('VideoObject');
    expect(data.name).toBe('Sport Event');
    expect(data.description).toBe('Une plateforme sportive');
    expect(data.thumbnailUrl).toBe(SITE_URL + 'videos/demo/landscape.webp');
    expect(data.contentUrl).toBe(SITE_URL + 'videos/demo/landscape.mp4');
    expect(data.uploadDate).toBe('2026-11-20');
    expect(data.duration).toBe('PT20S');
  });

  it('apply twice keeps a single script with the latest project', () => {
    seo.apply(makeProject({ title: 'First' }));
    seo.apply(makeProject({ title: 'Second' }));

    const scripts = document.querySelectorAll(SCRIPT_SELECTOR);
    expect(scripts.length).toBe(1);
    expect(JSON.parse(scripts[0].textContent ?? '').name).toBe('Second');
  });

  it('apply sets og:image and twitter:image to the absolute poster', () => {
    seo.apply(makeProject());

    const poster = SITE_URL + 'videos/demo/landscape.webp';
    expect(metaContent('meta[property="og:image"]')).toBe(poster);
    expect(metaContent('meta[name="twitter:image"]')).toBe(poster);
  });

  it('clear removes the script and restores the default image', () => {
    seo.apply(makeProject());
    seo.clear();

    const fallback = SITE_URL + 'images/paris-stage-wide.webp';
    expect(document.querySelector(SCRIPT_SELECTOR)).toBeNull();
    expect(metaContent('meta[property="og:image"]')).toBe(fallback);
    expect(metaContent('meta[name="twitter:image"]')).toBe(fallback);
  });

  it('apply points canonical and og:url at the project page', () => {
    const existing = document.createElement('link');
    existing.rel = 'canonical';
    existing.href = SITE_URL;
    document.head.appendChild(existing);

    seo.apply(makeProject({ slug: 'sport-event' }));

    const projectUrl = SITE_URL + 'projects/sport-event';
    expect(canonicalHrefs()).toEqual([projectUrl]);
    expect(metaContent('meta[property="og:url"]')).toBe(projectUrl);
  });

  it('apply creates the canonical link when the page has none', () => {
    seo.apply(makeProject({ slug: 'sport-event' }));

    expect(canonicalHrefs()).toEqual([SITE_URL + 'projects/sport-event']);
  });

  it('clear restores canonical and og:url to the site root', () => {
    seo.apply(makeProject({ slug: 'sport-event' }));
    seo.clear();

    expect(canonicalHrefs()).toEqual([SITE_URL]);
    expect(metaContent('meta[property="og:url"]')).toBe(SITE_URL);
  });
});
