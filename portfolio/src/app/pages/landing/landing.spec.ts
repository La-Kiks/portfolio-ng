import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { Landing } from './landing';

/** Stub matchMedia for a viewport width (jsdom has no matchMedia). */
function stubViewport(width: number): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => {
      const min = /min-width:\s*(\d+)px/.exec(query);
      const max = /max-width:\s*(\d+)px/.exec(query);
      const matches =
        (min ? width >= Number(min[1]) : true) && (max ? width <= Number(max[1]) : true);
      return { matches, media: query };
    }),
  );
}

describe('Landing', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [Landing],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function root(fixture: { nativeElement: HTMLElement }): HTMLElement {
    return fixture.nativeElement.querySelector('.landing-root') as HTMLElement;
  }

  it('should create', () => {
    stubViewport(1280);
    const fixture = TestBed.createComponent(Landing);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('plays the entrance only on the first landing view', () => {
    stubViewport(1280);
    const first = TestBed.createComponent(Landing);
    first.detectChanges();
    expect(root(first).classList).toContain('entrance');

    const second = TestBed.createComponent(Landing);
    second.detectChanges();
    expect(root(second).classList).not.toContain('entrance');
    expect(second.componentInstance.entering()).toBe(false);
  });

  /** Mark the hero images complete and fire a load event (jsdom never loads images). */
  function loadHeroImages(fixture: { nativeElement: HTMLElement }): void {
    const host = fixture.nativeElement;
    let carouselImg = host.querySelector<HTMLImageElement>('.grid-carousel img');
    if (!carouselImg) {
      carouselImg = document.createElement('img');
      host.querySelector('.grid-carousel')!.appendChild(carouselImg);
    }
    const profileImg = host.querySelector<HTMLImageElement>('.grid-profile img')!;
    for (const img of [profileImg, carouselImg]) {
      Object.defineProperty(img, 'complete', { configurable: true, value: true });
    }
    carouselImg.dispatchEvent(new Event('load'));
  }

  it('holds the bentos until both hero images have loaded', () => {
    stubViewport(1280);
    const fixture = TestBed.createComponent(Landing);
    fixture.detectChanges();
    expect(fixture.componentInstance.ready()).toBe(false);
    expect(root(fixture).classList).not.toContain('ready');

    loadHeroImages(fixture);
    fixture.detectChanges();
    expect(fixture.componentInstance.ready()).toBe(true);
    expect(root(fixture).classList).toContain('ready');
  });

  it('starts anyway after 1200ms if the hero images are slow', () => {
    stubViewport(1280);
    const fixture = TestBed.createComponent(Landing);
    fixture.detectChanges();
    vi.advanceTimersByTime(1199);
    expect(fixture.componentInstance.ready()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(fixture.componentInstance.ready()).toBe(true);
  });

  it('clears entering 1680ms after the start on desktop', () => {
    stubViewport(1280);
    const fixture = TestBed.createComponent(Landing);
    fixture.detectChanges();
    expect(root(fixture).classList).toContain('entering');

    loadHeroImages(fixture);
    vi.advanceTimersByTime(1679);
    expect(fixture.componentInstance.entering()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(fixture.componentInstance.entering()).toBe(false);
  });

  it('clears entering 1300ms after the start on tablet', () => {
    stubViewport(800);
    const fixture = TestBed.createComponent(Landing);
    fixture.detectChanges();

    loadHeroImages(fixture);
    vi.advanceTimersByTime(1299);
    expect(fixture.componentInstance.entering()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(fixture.componentInstance.entering()).toBe(false);
  });

  it('does not hold entering on mobile', () => {
    stubViewport(390);
    const fixture = TestBed.createComponent(Landing);
    expect(fixture.componentInstance.entering()).toBe(false);
    vi.advanceTimersByTime(1200);
    expect(fixture.componentInstance.ready()).toBe(false);
  });
});
