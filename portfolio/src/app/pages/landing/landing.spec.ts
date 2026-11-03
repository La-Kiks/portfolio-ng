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

  it('clears entering after 1240ms on desktop', () => {
    stubViewport(1280);
    const fixture = TestBed.createComponent(Landing);
    fixture.detectChanges();
    expect(fixture.componentInstance.entering()).toBe(true);
    expect(root(fixture).classList).toContain('entering');

    vi.advanceTimersByTime(1239);
    expect(fixture.componentInstance.entering()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(fixture.componentInstance.entering()).toBe(false);
  });

  it('clears entering after 970ms on tablet', () => {
    stubViewport(800);
    const fixture = TestBed.createComponent(Landing);
    vi.advanceTimersByTime(969);
    expect(fixture.componentInstance.entering()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(fixture.componentInstance.entering()).toBe(false);
  });

  it('does not hold entering on mobile', () => {
    stubViewport(390);
    const fixture = TestBed.createComponent(Landing);
    expect(fixture.componentInstance.entering()).toBe(false);
  });
});
