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

  function soundToggle(fixture: { nativeElement: HTMLElement }): HTMLButtonElement {
    return el(fixture).querySelector('.sound-toggle') as HTMLButtonElement;
  }

  it('has no floating About button', async () => {
    const fixture = await setup();
    expect(el(fixture).querySelector('.about-fab')).toBeNull();
  });

  it('shows the sound button only on project screens', async () => {
    const fixture = await setup();
    expect(el(fixture).querySelectorAll('.sound-toggle').length).toBe(1);
    expect(soundToggle(fixture).classList).not.toContain('visible');

    report(fixture, 1, 1);
    expect(soundToggle(fixture).classList).toContain('visible');

    report(fixture, 3, 1);
    expect(soundToggle(fixture).classList).not.toContain('visible');
  });

  it('sound button toggles the sound of every reel', async () => {
    const fixture = await setup();
    report(fixture, 1, 1);
    const button = soundToggle(fixture);
    expect(button.getAttribute('type')).toBe('button');
    expect(button.getAttribute('aria-label')).toBe('Son');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.querySelector('i')?.classList).toContain('fa-volume-high');

    button.click();
    fixture.detectChanges();
    expect(TestBed.inject(FeedSound).on()).toBe(false);
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.querySelector('i')?.classList).toContain('fa-volume-xmark');
    for (const video of Array.from(el(fixture).querySelectorAll('video'))) {
      expect(video.muted).toBe(true);
    }

    button.click();
    fixture.detectChanges();
    expect(TestBed.inject(FeedSound).on()).toBe(true);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    for (const video of Array.from(el(fixture).querySelectorAll('video'))) {
      expect(video.muted).toBe(false);
    }
  });

  it('sound button unlocks a reel the autoplay fallback muted', async () => {
    const fixture = await setup();
    await blockedAutoplay(fixture);
    soundToggle(fixture).click();
    fixture.detectChanges();
    expect(reel(fixture, 1).muted).toBe(false);
    expect(TestBed.inject(FeedSound).on()).toBe(true);
    expect(soundToggle(fixture).getAttribute('aria-pressed')).toBe('true');
  });

  it('reels start in the current sound state, without autoplay too', async () => {
    stubReducedMotion(true);
    const subject = new Subject<Project[]>();
    const fixture = await setup(subject);
    // Sound already off (e.g. muted before visiting a project page) when the reels are created.
    TestBed.inject(FeedSound).set(false);

    subject.next(PROJECTS);
    fixture.detectChanges();
    await fixture.whenStable();
    const videos = Array.from(el(fixture).querySelectorAll('video'));
    expect(videos.length).toBe(2);
    for (const video of videos) {
      expect(video.muted).toBe(true);
    }
    expect(media.play).not.toHaveBeenCalled();
  });

  it('sound button follows the native mute', async () => {
    const fixture = await setup();
    report(fixture, 1, 1);

    reel(fixture, 1).muted = true;
    fixture.detectChanges();
    expect(soundToggle(fixture).getAttribute('aria-pressed')).toBe('false');

    reel(fixture, 1).muted = false;
    fixture.detectChanges();
    expect(soundToggle(fixture).getAttribute('aria-pressed')).toBe('true');
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
    const dots = (): NodeListOf<HTMLElement> => el(fixture).querySelectorAll('.indicator span');

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

  it('videos have preload none, active and next get metadata', async () => {
    const three = [
      ...PROJECTS,
      makeProject({ id: '3', slug: 'gamma', title: 'Gamma', description: 'Third' }),
    ];
    const fixture = await setup(of(three));
    report(fixture, 1, 1);
    expect(reel(fixture, 1).getAttribute('preload')).toBe('metadata');
    expect(reel(fixture, 2).getAttribute('preload')).toBe('metadata');
    expect(reel(fixture, 3).getAttribute('preload')).toBe('none');
  });

  it('reels have native controls and no per-reel buttons', async () => {
    const fixture = await setup();
    const videos = Array.from(el(fixture).querySelectorAll('.feed video'));
    expect(videos.length).toBe(2);
    for (const video of videos) {
      expect(video.hasAttribute('controls')).toBe(true);
    }
    expect(el(fixture).querySelector('.screen-frame button')).toBeNull();
    expect(el(fixture).querySelector('.reel-play-toggle')).toBeNull();
  });

  it('active reel plays unmuted by default', async () => {
    const fixture = await setup();
    report(fixture, 1, 1);
    expect(reel(fixture, 1).muted).toBe(false);
    expect(media.play.mock.contexts).toContain(reel(fixture, 1));
  });

  /** Activate screen 1 with its unmuted play() refused, as before any user gesture. */
  async function blockedAutoplay(fixture: Awaited<ReturnType<typeof setup>>): Promise<void> {
    media.play.mockRejectedValueOnce(new DOMException('', 'NotAllowedError'));
    report(fixture, 1, 1);
    await flushPromises();
    fixture.detectChanges();
  }

  it('blocked unmuted autoplay plays muted but keeps the intent', async () => {
    const fixture = await setup();
    await blockedAutoplay(fixture);

    const video = reel(fixture, 1);
    expect(video.muted).toBe(true);
    expect(media.play.mock.contexts).toEqual([video, video]);
    expect(TestBed.inject(FeedSound).on()).toBe(true);
  });

  it('fallback muting does not count as a user mute', async () => {
    const fixture = await setup();
    const video = reel(fixture, 1);
    const changes = vi.fn();
    video.addEventListener('volumechange', changes);
    await blockedAutoplay(fixture);

    // jsdom fires volumechange on the fallback's own `muted = true`.
    expect(changes).toHaveBeenCalledTimes(1);
    expect(video.muted).toBe(true);
    expect(TestBed.inject(FeedSound).on()).toBe(true);

    // Browsers queue volumechange: a late echo of the pre-play sync is not a user mute either.
    video.dispatchEvent(new Event('volumechange'));
    expect(TestBed.inject(FeedSound).on()).toBe(true);
  });

  it('reels muted by the fallback get their sound back once it is unlocked', async () => {
    const fixture = await setup();
    await blockedAutoplay(fixture);
    media.play.mockRejectedValueOnce(new DOMException('', 'NotAllowedError'));
    report(fixture, 2, 1);
    await flushPromises();
    expect(reel(fixture, 1).muted).toBe(true);
    expect(reel(fixture, 2).muted).toBe(true);

    (el(fixture).querySelector('.feed') as HTMLElement).click();
    expect(reel(fixture, 2).muted).toBe(false);

    report(fixture, 1, 1);
    expect(reel(fixture, 1).muted).toBe(false);
    expect(TestBed.inject(FeedSound).on()).toBe(true);
  });

  it('first tap in the feed unmutes the active reel', async () => {
    const fixture = await setup();
    await blockedAutoplay(fixture);
    const video = reel(fixture, 1);
    const feed = el(fixture).querySelector('.feed') as HTMLElement;

    media.play.mockClear();
    feed.click();
    expect(video.muted).toBe(false);
    expect(media.play.mock.contexts).toContain(video);

    // One-shot: a later tap leaves the reel alone.
    video.muted = true;
    media.play.mockClear();
    feed.click();
    expect(video.muted).toBe(true);
    expect(media.play).not.toHaveBeenCalled();
  });

  it('a key press also unmutes the active reel', async () => {
    const fixture = await setup();
    await blockedAutoplay(fixture);
    const feed = el(fixture).querySelector('.feed') as HTMLElement;

    feed.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(reel(fixture, 1).muted).toBe(false);
  });

  it('tapping after the user muted keeps the reel muted', async () => {
    const fixture = await setup();
    await blockedAutoplay(fixture);
    TestBed.inject(FeedSound).set(false);
    fixture.detectChanges();

    (el(fixture).querySelector('.feed') as HTMLElement).click();
    expect(reel(fixture, 1).muted).toBe(true);
  });

  it('user mute is remembered', async () => {
    const fixture = await setup();
    report(fixture, 1, 1);
    const video = reel(fixture, 1);

    video.muted = true;
    video.dispatchEvent(new Event('volumechange'));
    fixture.detectChanges();
    expect(TestBed.inject(FeedSound).on()).toBe(false);

    report(fixture, 2, 1);
    expect(reel(fixture, 2).muted).toBe(true);
  });

  it('volume at zero counts as a mute', async () => {
    const fixture = await setup();
    report(fixture, 1, 1);
    const video = reel(fixture, 1);

    video.volume = 0;
    video.dispatchEvent(new Event('volumechange'));
    expect(TestBed.inject(FeedSound).on()).toBe(false);
  });

  it('user unmute restores sound', async () => {
    const fixture = await setup();
    report(fixture, 1, 1);
    const video = reel(fixture, 1);
    video.muted = true;
    video.dispatchEvent(new Event('volumechange'));
    fixture.detectChanges();

    video.muted = false;
    video.dispatchEvent(new Event('volumechange'));
    fixture.detectChanges();
    expect(TestBed.inject(FeedSound).on()).toBe(true);
    expect(reel(fixture, 2).muted).toBe(false);
  });

  it('does not replay a reel whose unmuted play is rejected after scrolling on', async () => {
    const fixture = await setup();
    media.play.mockRejectedValueOnce(new DOMException('', 'NotAllowedError'));
    report(fixture, 1, 1);
    report(fixture, 2, 1);
    await flushPromises();
    fixture.detectChanges();

    const contexts = media.play.mock.contexts;
    expect(contexts.filter((context) => context === reel(fixture, 1)).length).toBe(1);
    expect(contexts).toContain(reel(fixture, 2));
    expect(TestBed.inject(FeedSound).on()).toBe(true);
  });

  it('stays unmuted when play is merely interrupted', async () => {
    const fixture = await setup();
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
