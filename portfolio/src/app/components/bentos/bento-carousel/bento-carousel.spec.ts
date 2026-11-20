import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BentoCarousel } from './bento-carousel';
import { makeProject } from '../../../../testing/project-fixture';
import { stubMatchMedia, stubMedia } from '../../../../testing/media-stubs';

const PROJECTS = [
  makeProject({ id: '1', slug: 'one', title: 'One', description: 'First', images: ['/img/1.webp'] }),
  makeProject({ id: '2', slug: 'two', title: 'Two', description: 'Second', images: ['/img/2.webp'] }),
  makeProject({ id: '3', slug: 'three', title: 'Three', description: 'Third', images: ['/img/3.webp'] }),
];

describe('BentoCarousel', () => {
  let component: BentoCarousel;
  let fixture: ComponentFixture<BentoCarousel>;
  let httpMock: HttpTestingController;

  let media: ReturnType<typeof stubMedia>;

  beforeEach(async () => {
    media = stubMedia();
    stubMatchMedia(() => false);
    await TestBed.configureTestingModule({
      imports: [BentoCarousel],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(BentoCarousel);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit -> load
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function flushProjects(): void {
    httpMock.expectOne('files/projects.json').flush(PROJECTS);
    fixture.detectChanges();
  }

  it('should create', () => {
    flushProjects();
    expect(component).toBeTruthy();
  });

  it('maps loaded projects and starts at slide 0', () => {
    flushProjects();
    expect(component.projects().length).toBe(3);
    expect(component.currentIndex()).toBe(0);
    expect(component.currentProject()?.route).toBe('/projects/one');
  });

  it('next wraps forward past the last slide', () => {
    flushProjects();
    component.nextProject();
    component.nextProject();
    component.nextProject();
    expect(component.currentIndex()).toBe(0);
  });

  it('previous wraps back from the first slide', () => {
    flushProjects();
    component.previousProject();
    expect(component.currentIndex()).toBe(2);
  });

  it('goToSlide jumps to the given slide', () => {
    flushProjects();
    component.goToSlide(1);
    expect(component.currentProject()?.title).toBe('Two');
  });

  it('navigating slides after init does not throw NG02953 and renders the new slide', () => {
    flushProjects();
    component.nextProject();
    expect(() => fixture.detectChanges()).not.toThrow();
    component.goToSlide(2);
    expect(() => fixture.detectChanges()).not.toThrow();
    const video: HTMLVideoElement = fixture.nativeElement.querySelector('video');
    expect(video.getAttribute('poster')).toBe('videos/demo/landscape.webp');
    expect(component.currentProject()?.title).toBe('Three');
  });

  it('shows a visible error message when loading fails', () => {
    httpMock.expectOne('files/projects.json').error(new ProgressEvent('error'));
    fixture.detectChanges();
    expect(component.hasError()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Impossible de charger les projets');
  });

  it('links to the current project and follows the slide', () => {
    flushProjects();
    const cta = (): HTMLAnchorElement => fixture.nativeElement.querySelector('.carousel-cta');
    expect(cta().getAttribute('href')).toBe('/projects/one');

    component.goToSlide(1);
    fixture.detectChanges();
    expect(cta().getAttribute('href')).toBe('/projects/two');
  });

  it('keeps the image link out of the tab order', () => {
    flushProjects();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.carousel-media');
    expect(link.getAttribute('href')).toBe('/projects/one');
    expect(link.getAttribute('tabindex')).toBe('-1');
    expect(link.getAttribute('aria-hidden')).toBe('true');
  });

  describe('hover preview', () => {
    const media$ = (): HTMLElement => fixture.nativeElement.querySelector('.carousel-media');
    const video = (): HTMLVideoElement => fixture.nativeElement.querySelector('video');

    it("plays the current slide's loop on mouseenter", () => {
      flushProjects();
      media$().dispatchEvent(new Event('mouseenter'));
      expect(media.play).toHaveBeenCalledTimes(1);
      expect(video().getAttribute('src')).toMatch(/landscape-loop\.mp4$/);
      expect(video().muted).toBe(true);
      expect(video().getAttribute('poster')).toMatch(/landscape\.webp$/);
    });

    it('pauses and rewinds on mouseleave', () => {
      flushProjects();
      media$().dispatchEvent(new Event('mouseenter'));
      video().currentTime = 3;
      media$().dispatchEvent(new Event('mouseleave'));
      expect(media.pause).toHaveBeenCalled();
      expect(video().currentTime).toBe(0);
    });

    it('stops the previous video when the slide changes', () => {
      flushProjects();
      media$().dispatchEvent(new Event('mouseenter'));
      media.pause.mockClear();
      fixture.nativeElement.querySelector('[aria-label="Projet suivant"]').click();
      fixture.detectChanges();
      expect(media.pause).toHaveBeenCalled();
      expect(media.play).toHaveBeenCalledTimes(1);
    });

    it('does not play when reduced motion is preferred', () => {
      stubMatchMedia(q => q.includes('reduce'));
      flushProjects();
      media$().dispatchEvent(new Event('mouseenter'));
      expect(media.play).not.toHaveBeenCalled();
    });
  });
});
