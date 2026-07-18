import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Loader } from './loader';

describe('Loader', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    vi.useFakeTimers();
    await TestBed.configureTestingModule({ imports: [Loader] }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the loader for 1s on first visit, then completes and stamps the time', () => {
    const fixture = TestBed.createComponent(Loader);
    const component = fixture.componentInstance;
    let completed = false;
    component.loadingComplete.subscribe(() => (completed = true));

    fixture.detectChanges(); // triggers ngOnInit
    expect(component.showLoader()).toBe(true);
    expect(completed).toBe(false);

    vi.advanceTimersByTime(1000);
    expect(component.showLoader()).toBe(false);
    expect(completed).toBe(true);
    expect(sessionStorage.getItem('loaderTimestamp')).not.toBeNull();
  });

  it('skips the loader when shown within the last 15 minutes', () => {
    sessionStorage.setItem('loaderTimestamp', Date.now().toString());
    const fixture = TestBed.createComponent(Loader);
    const component = fixture.componentInstance;
    let completed = false;
    component.loadingComplete.subscribe(() => (completed = true));

    fixture.detectChanges();
    expect(component.showLoader()).toBe(false);
    expect(completed).toBe(true);
  });

  it('shows the loader again when the last visit was over 15 minutes ago', () => {
    sessionStorage.setItem('loaderTimestamp', (Date.now() - 16 * 60 * 1000).toString());
    const fixture = TestBed.createComponent(Loader);
    const component = fixture.componentInstance;

    fixture.detectChanges();
    expect(component.showLoader()).toBe(true);
  });
});
