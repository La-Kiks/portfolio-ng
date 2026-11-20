import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { MobileFeed } from './mobile-feed';
import { Project, ProjectService } from '../../services/projects/project';
import { makeProject } from '../../../testing/project-fixture';
import { FeedPosition } from '../../services/feed-position/feed-position';
import { FeedSound } from '../../services/feed-sound/feed-sound';
import { stubMedia } from '../../../testing/media-stubs';

const PROJECTS: Project[] = [
  makeProject({ id: '1', slug: 'alpha', title: 'Alpha', description: 'First', images: ['images/a.webp'] }),
  makeProject({ id: '2', slug: 'beta', title: 'Beta', description: 'Second', images: ['images/b.webp'] }),
];

let observerCallback: IntersectionObserverCallback;
let observers: FakeIntersectionObserver[] = [];

class FakeIntersectionObserver {
  readonly observed: Element[] = [];
  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback;
    observers.push(this);
  }
  observe = vi.fn((target: Element) => {
    this.observed.push(target);
  });
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = (): IntersectionObserverEntry[] => [];
}

function stubReducedMotion(reduce: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({ matches: reduce && query.includes('reduce'), media: query })),
  );
}

async function setup(projects$ = of(PROJECTS), savedIndex = 0) {
  TestBed.configureTestingModule({
    imports: [MobileFeed],
    providers: [
      provideRouter([]),
      { provide: ProjectService, useValue: { getAllProjects: () => projects$ } },
    ],
  });
  TestBed.inject(FeedPosition).index = savedIndex;
  const fixture = TestBed.createComponent(MobileFeed);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

function el(fixture: { nativeElement: HTMLElement }): HTMLElement {
  return fixture.nativeElement;
}

/** Simulate the observer reporting one screen entering/leaving view. */
function report(
  fixture: { nativeElement: HTMLElement; detectChanges: () => void },
  index: number,
  intersectionRatio: number,
  isIntersecting = intersectionRatio > 0,
): void {
  const target = el(fixture).querySelector(`[data-screen="${index}"]`);
  observerCallback(
    [{ target, intersectionRatio, isIntersecting } as unknown as IntersectionObserverEntry],
    {} as IntersectionObserver,
  );
  fixture.detectChanges();
}

function reel(fixture: { nativeElement: HTMLElement }, screen: number): HTMLVideoElement {
  return el(fixture).querySelector(`[data-screen="${screen}"] video`) as HTMLVideoElement;
}

function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

describe('MobileFeed', () => {
  let media: ReturnType<typeof stubMedia>;

  beforeEach(() => {
    observers = [];
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    stubReducedMotion(false);
    media = stubMedia();
  });

  afterEach(() => {
    // Destroy the feed (it pauses its reels) while play/pause are still stubbed.
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders intro, one screen per project, then contact', async () => {
    const fixture = await setup();
    const screens = el(fixture).querySelectorAll('.screen');
    expect(screens.length).toBe(4);
    expect(screens[0].textContent).toContain('Web developer');
    expect(screens[1].textContent).toContain('Alpha');
    expect(screens[2].textContent).toContain('Beta');
    expect(screens[3].textContent).toContain('Travaillons ensemble');
    expect(el(fixture).querySelectorAll('.indicator span').length).toBe(4);
  });

  it('links each project and the contact actions', async () => {
    const fixture = await setup();
    const projectLinks = el(fixture).querySelectorAll<HTMLAnchorElement>('.project-link');
    expect(projectLinks[0].getAttribute('href')).toBe('/projects/alpha');
    expect(projectLinks[1].getAttribute('href')).toBe('/projects/beta');

    const rows = el(fixture).querySelectorAll<HTMLAnchorElement>('.contact-row');
    expect(rows.length).toBe(4);
    expect(rows[0].getAttribute('href')).toBe('mailto:kilian.audroin@gmail.com');
    expect(rows[0].getAttribute('target')).toBeNull();
    expect(rows[1].getAttribute('target')).toBe('_blank');
    expect(rows[1].getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('shows the About button only once the intro leaves the screen', async () => {
    const fixture = await setup();
    const fab = (): HTMLElement => el(fixture).querySelector('.about-fab') as HTMLElement;
    expect(fab().getAttribute('href')).toBe('/about');
    expect(fab().classList).not.toContain('visible');

    report(fixture, 0, 0);
    expect(fab().classList).toContain('visible');

    report(fixture, 0, 1);
    expect(fab().classList).not.toContain('visible');
  });

  it('highlights the indicator dot of the screen in view', async () => {
    const fixture = await setup();
    const dots = (): NodeListOf<HTMLElement> => el(fixture).querySelectorAll('.indicator span');
    expect(dots()[0].classList).toContain('active');

    report(fixture, 2, 1);
    expect(dots()[2].classList).toContain('active');
    expect(dots()[0].classList).not.toContain('active');
  });

  it('uses the visibility ratio, not mere intersection', async () => {
    const fixture = await setup();
    const fab = (): HTMLElement => el(fixture).querySelector('.about-fab') as HTMLElement;
    const dots = (): NodeListOf<HTMLElement> => el(fixture).querySelectorAll('.indicator span');

    report(fixture, 0, 0.3, true);
    expect(fab().classList).toContain('visible');

    report(fixture, 1, 0.3, true);
    expect(dots()[1].classList).not.toContain('active');
    expect(dots()[0].classList).toContain('active');
  });

  it('adds screens when projects arrive after the first render', async () => {
    const subject = new Subject<Project[]>();
    const fixture = await setup(subject);
    expect(el(fixture).querySelectorAll('.screen').length).toBe(2);
    expect(el(fixture).querySelectorAll('.indicator span').length).toBe(2);
    expect(observers.length).toBe(1);
    const first = observers[0];

    subject.next(PROJECTS);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(el(fixture).querySelectorAll('.screen').length).toBe(4);
    expect(el(fixture).querySelectorAll('.indicator span').length).toBe(4);
    expect(first.disconnect).toHaveBeenCalled();
    const latest = observers[observers.length - 1];
    expect(latest).not.toBe(first);
    expect(latest.observed.length).toBe(4);
    for (const screen of Array.from(el(fixture).querySelectorAll('.screen'))) {
      expect(latest.observed).toContain(screen);
    }

    fixture.destroy();
    expect(latest.disconnect).toHaveBeenCalled();
  });

  it('shows a single error screen when projects fail to load', async () => {
    const fixture = await setup(throwError(() => new Error('network')));
    const screens = el(fixture).querySelectorAll('.screen');
    expect(screens.length).toBe(3);
    expect(screens[1].textContent).toContain('Impossible de charger les projets');
  });

  it('scrolls back to the top smoothly, or instantly under reduced motion', async () => {
    const fixture = await setup();
    const feed = el(fixture).querySelector('.feed') as HTMLElement;
    const scrollTo = vi.fn();
    feed.scrollTo = scrollTo;

    fixture.componentInstance.backToTop();
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'smooth' });

    stubReducedMotion(true);
    fixture.componentInstance.backToTop();
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'auto' });
  });

  it('shows each project as a vertical reel over its poster', async () => {
    const fixture = await setup();
    const video = reel(fixture, 1);
    expect(video.getAttribute('src')).toBe('videos/demo/vertical.mp4');
    expect(video.getAttribute('poster')).toBe('videos/demo/vertical.webp');
    expect(video.hasAttribute('playsinline')).toBe(true);
    expect(video.loop).toBe(true);
    expect(el(fixture).querySelector('[data-screen="1"] img')).toBeNull();
  });

  it("plays only the active screen's video", async () => {
    const fixture = await setup();
    report(fixture, 1, 1);
    expect(media.play.mock.contexts).toContain(reel(fixture, 1));
    expect(media.play.mock.contexts).not.toContain(reel(fixture, 2));

    media.play.mockClear();
    media.pause.mockClear();
    report(fixture, 2, 1);
    expect(media.pause.mock.contexts).toContain(reel(fixture, 1));
    expect(media.play.mock.contexts).toEqual([reel(fixture, 2)]);
  });

  it('videos start muted with preload none, active and next get metadata', async () => {
    const three = [
      ...PROJECTS,
      makeProject({ id: '3', slug: 'gamma', title: 'Gamma', description: 'Third' }),
    ];
    const fixture = await setup(of(three));
    report(fixture, 1, 1);
    expect(reel(fixture, 1).getAttribute('preload')).toBe('metadata');
    expect(reel(fixture, 2).getAttribute('preload')).toBe('metadata');
    expect(reel(fixture, 3).getAttribute('preload')).toBe('none');
    for (const screen of [1, 2, 3]) {
      expect(reel(fixture, screen).muted).toBe(true);
    }
  });

  it('sound button unmutes every feed video', async () => {
    const fixture = await setup();
    const button = el(fixture).querySelector('.sound-toggle') as HTMLButtonElement;
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.getAttribute('aria-label')).toBe('Activer le son');
    expect(button.querySelector('i')?.classList).toContain('fa-volume-xmark');

    button.click();
    fixture.detectChanges();
    for (const video of Array.from(el(fixture).querySelectorAll('video'))) {
      expect(video.muted).toBe(false);
    }
    for (const toggle of Array.from(el(fixture).querySelectorAll('.sound-toggle'))) {
      expect(toggle.getAttribute('aria-pressed')).toBe('true');
      expect(toggle.getAttribute('aria-label')).toBe('Couper le son');
    }
    expect(button.querySelector('i')?.classList).toContain('fa-volume-high');
  });

  it('falls back to muted when unmuted play is rejected', async () => {
    const fixture = await setup();
    report(fixture, 1, 1);
    fixture.componentInstance.toggleSound();
    fixture.detectChanges();
    const sound = TestBed.inject(FeedSound);
    expect(sound.on()).toBe(true);

    media.play.mockClear();
    media.play.mockRejectedValueOnce(new DOMException('', 'NotAllowedError'));
    report(fixture, 2, 1);
    await flushPromises();
    fixture.detectChanges();

    const video = reel(fixture, 2);
    expect(video.muted).toBe(true);
    expect(media.play.mock.contexts).toEqual([video, video]);
    expect(sound.on()).toBe(false);
    expect(
      (el(fixture).querySelector('.sound-toggle') as HTMLElement).getAttribute('aria-pressed'),
    ).toBe('false');
  });

  it('does not replay a reel whose unmuted play is rejected after scrolling on', async () => {
    const fixture = await setup();
    fixture.componentInstance.toggleSound();
    media.play.mockRejectedValueOnce(new DOMException('', 'NotAllowedError'));
    report(fixture, 1, 1);
    report(fixture, 2, 1);
    await flushPromises();
    fixture.detectChanges();

    const contexts = media.play.mock.contexts;
    expect(contexts.filter((context) => context === reel(fixture, 1)).length).toBe(1);
    expect(contexts).toContain(reel(fixture, 2));
    expect(TestBed.inject(FeedSound).on()).toBe(false);
  });

  it('keeps the sound on when play is merely interrupted', async () => {
    const fixture = await setup();
    fixture.componentInstance.toggleSound();
    media.play.mockRejectedValueOnce(new DOMException('', 'AbortError'));
    report(fixture, 1, 1);
    await flushPromises();
    expect(TestBed.inject(FeedSound).on()).toBe(true);
    expect(reel(fixture, 1).muted).toBe(false);
  });

  it('no autoplay with reduced motion', async () => {
    stubReducedMotion(true);
    const fixture = await setup();
    report(fixture, 1, 1);
    expect(media.play).not.toHaveBeenCalled();
  });

  it('no autoplay when the connection asks to save data', async () => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { saveData: true },
    });
    try {
      const fixture = await setup();
      report(fixture, 1, 1);
      expect(media.play).not.toHaveBeenCalled();
    } finally {
      delete (navigator as { connection?: unknown }).connection;
    }
  });

  it('tapping the video toggles play/pause', async () => {
    const paused = new WeakMap<HTMLMediaElement, boolean>();
    vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockImplementation(function (
      this: HTMLMediaElement,
    ) {
      return paused.get(this) ?? true;
    });
    media.play.mockImplementation(function (this: HTMLMediaElement) {
      paused.set(this, false);
      return Promise.resolve();
    });
    media.pause.mockImplementation(function (this: HTMLMediaElement) {
      paused.set(this, true);
    });
    stubReducedMotion(true);
    const fixture = await setup();
    report(fixture, 1, 1);
    const video = reel(fixture, 1);
    expect(video.paused).toBe(true);

    video.click();
    expect(video.paused).toBe(false);

    video.click();
    expect(video.paused).toBe(true);
  });

  it('shows a play hint while the reel is paused', async () => {
    const fixture = await setup();
    const hint = (): Element | null =>
      el(fixture).querySelector('[data-screen="1"] .reel-play-hint');
    expect(hint()?.classList).not.toContain('off');

    reel(fixture, 1).dispatchEvent(new Event('play'));
    fixture.detectChanges();
    expect(hint()?.classList).toContain('off');

    reel(fixture, 1).dispatchEvent(new Event('pause'));
    fixture.detectChanges();
    expect(hint()?.classList).not.toContain('off');
  });

  it('pauses every reel when leaving the feed', async () => {
    const fixture = await setup();
    report(fixture, 1, 1);
    const videos = Array.from(el(fixture).querySelectorAll('video'));
    media.pause.mockClear();
    fixture.destroy();
    for (const video of videos) {
      expect(media.pause.mock.contexts).toContain(video);
    }
  });

  it('restores the saved screen on first render', async () => {
    const scrollTo = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    });
    // Spy on jsdom's own getter so mockRestore() puts the native one back.
    const offsetTop = vi
      .spyOn(HTMLElement.prototype, 'offsetTop', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return Number(this.dataset['screen'] ?? 0) * 100;
      });
    try {
      const fixture = await setup(of(PROJECTS), 2);
      expect(scrollTo).toHaveBeenCalledWith({ top: 200, behavior: 'auto' });
      expect(fixture.componentInstance.activeIndex()).toBe(2);
      expect(fixture.componentInstance.pastIntro()).toBe(true);
    } finally {
      offsetTop.mockRestore();
      delete (HTMLElement.prototype as { scrollTo?: unknown }).scrollTo;
    }
  });

  it('stores the active screen on destroy', async () => {
    const fixture = await setup();
    fixture.componentInstance.activeIndex.set(3);
    fixture.destroy();
    expect(TestBed.inject(FeedPosition).index).toBe(3);
  });

  function description(fixture: { nativeElement: HTMLElement }, screen: number): HTMLButtonElement {
    return el(fixture).querySelector(
      `[data-screen="${screen}"] .screen-description`,
    ) as HTMLButtonElement;
  }

  it('makes the intro title the page heading', async () => {
    const fixture = await setup();
    const headings = el(fixture).querySelectorAll('h1');
    expect(headings.length).toBe(1);
    expect(headings[0].textContent).toContain('Web developer');
  });

  it('unfolds a description on click and folds it on a second click', async () => {
    const fixture = await setup();
    const button = description(fixture, 1);
    expect(button.getAttribute('aria-expanded')).toBe('false');

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(button.classList).toContain('open');

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.classList).not.toContain('open');
  });

  it('keeps a single description open', async () => {
    const fixture = await setup();
    description(fixture, 0).click();
    description(fixture, 1).click();
    fixture.detectChanges();
    expect(description(fixture, 0).getAttribute('aria-expanded')).toBe('false');
    expect(description(fixture, 1).getAttribute('aria-expanded')).toBe('true');
  });

  it('folds the open description when the active screen changes', async () => {
    const fixture = await setup();
    report(fixture, 1, 1);
    description(fixture, 1).click();
    fixture.detectChanges();
    expect(description(fixture, 1).getAttribute('aria-expanded')).toBe('true');

    report(fixture, 2, 1);
    expect(description(fixture, 1).getAttribute('aria-expanded')).toBe('false');
  });
});
