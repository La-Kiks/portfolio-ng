import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProjectDetail } from './project-detail';
import { MOBILE_QUERY } from '../../../components/loader/loader';
import { makeProject } from '../../../../testing/project-fixture';
import { stubMatchMedia } from '../../../../testing/media-stubs';

const PROJECTS = [
  makeProject({
    id: '1',
    slug: 'sport-event',
    title: 'Sport Event',
    description: 'Une plateforme sportive',
    images: [
      'images/sport-event/01b-accueil-haut-de-page.webp',
      'images/sport-event/02-inscription.webp',
    ],
    link: 'https://example.com/',
  }),
];

describe('ProjectDetail', () => {
  let fixture: ComponentFixture<ProjectDetail>;
  let httpMock: HttpTestingController;

  function setup(slug: string): void {
    TestBed.configureTestingModule({
      imports: [ProjectDetail],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { params: of({ slug }) } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProjectDetail);
    fixture.detectChanges();
  }

  function render(slug = 'sport-event'): HTMLElement {
    setup(slug);
    httpMock.expectOne('files/projects.json').flush(PROJECTS);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  beforeEach(() => {
    stubMatchMedia(() => false);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders the project and sets title and meta description', () => {
    const el = render();

    expect(el.textContent).toContain('Sport Event');
    expect(TestBed.inject(Title).getTitle()).toBe('Sport Event — Kilian Audroin');
    const description = document.querySelector('meta[name="description"]');
    expect(description?.getAttribute('content')).toBe('Une plateforme sportive');
  });

  it('shows the French back link to the home page', () => {
    expect(render().textContent).toContain("← Retour à l'accueil");
  });

  it('uses the landscape video on desktop', () => {
    const video = render().querySelector('video') as HTMLVideoElement;

    expect(video.getAttribute('src')).toMatch(/landscape\.mp4$/);
    expect(video.getAttribute('poster')).toMatch(/landscape\.webp$/);
    expect(video.hasAttribute('controls')).toBe(true);
    expect(video.hasAttribute('autoplay')).toBe(false);
  });

  it('uses the vertical video on mobile', () => {
    stubMatchMedia((query) => query === MOBILE_QUERY);
    const video = render().querySelector('video') as HTMLVideoElement;

    expect(video.getAttribute('src')).toMatch(/vertical\.mp4$/);
    expect(video.getAttribute('poster')).toMatch(/vertical\.webp$/);
  });

  it('renders the gallery from images', () => {
    const links = render().querySelectorAll<HTMLAnchorElement>('.detail-gallery a');

    expect(links.length).toBe(2);
    expect(links[1].getAttribute('href')).toBe('images/sport-event/02-inscription.webp');
    expect(links[1].getAttribute('target')).toBe('_blank');
    const alts = Array.from(links, (link) => link.querySelector('img')?.getAttribute('alt'));
    expect(alts).toEqual(['Sport Event — accueil haut de page', 'Sport Event — inscription']);
  });

  it('hides Voir le code when github is absent', () => {
    const el = render();

    expect(el.textContent).toContain('Voir le projet');
    expect(el.textContent).not.toContain('Voir le code');
  });

  it('injects the VideoObject script and removes it on destroy', () => {
    render();
    expect(document.querySelector('script#project-video-ld')).not.toBeNull();

    fixture.destroy();
    expect(document.querySelector('script#project-video-ld')).toBeNull();
  });

  it('shows the not-found error for an unknown slug', () => {
    expect(render('does-not-exist').textContent).toContain('Projet introuvable');
  });

  it('shows the error state when the request fails', () => {
    setup('sport-event');
    httpMock.expectOne('files/projects.json').error(new ProgressEvent('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Erreur lors du chargement du projet');
  });
});
