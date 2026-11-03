import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { MobileFeed } from './mobile-feed';
import { Project, ProjectService } from '../../services/projects/project';

const PROJECTS: Project[] = [
  { id: '1', slug: 'alpha', title: 'Alpha', description: 'First', images: ['/images/a.webp'] },
  { id: '2', slug: 'beta', title: 'Beta', description: 'Second', images: ['/images/b.webp'] },
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

async function setup(projects$ = of(PROJECTS)) {
  TestBed.configureTestingModule({
    imports: [MobileFeed],
    providers: [
      provideRouter([]),
      { provide: ProjectService, useValue: { getAllProjects: () => projects$ } },
    ],
  });
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

describe('MobileFeed', () => {
  beforeEach(() => {
    observers = [];
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    stubReducedMotion(false);
  });

  afterEach(() => vi.unstubAllGlobals());

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

    const cta = el(fixture).querySelector<HTMLAnchorElement>('.contact-cta');
    expect(cta?.getAttribute('href')).toBe('mailto:kilian.audroin@gmail.com');
    const icons = el(fixture).querySelectorAll<HTMLAnchorElement>('.contact-icon');
    expect(icons.length).toBe(3);
    expect(icons[0].getAttribute('target')).toBe('_blank');
    expect(icons[0].getAttribute('rel')).toBe('noopener noreferrer');
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

  it('skips projects without an image', async () => {
    const noImage: Project = {
      id: '3',
      slug: 'gamma',
      title: 'Gamma',
      description: 'Third',
      images: [],
    };
    const fixture = await setup(of([PROJECTS[0], noImage]));
    const screens = el(fixture).querySelectorAll('.screen');
    expect(screens.length).toBe(3);
    expect(el(fixture).textContent).not.toContain('Gamma');
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
});
