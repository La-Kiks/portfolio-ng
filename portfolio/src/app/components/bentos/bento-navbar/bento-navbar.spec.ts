import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BentoNavbar } from './bento-navbar';

describe('BentoNavbar', () => {
  let component: BentoNavbar;
  let fixture: ComponentFixture<BentoNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BentoNavbar],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BentoNavbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the name as plain text, not a heading', () => {
    fixture.componentRef.setInput('title', 'Kilian Audroin');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1')).toBeNull();
    expect(fixture.nativeElement.querySelector('.navbar-title').textContent).toContain(
      'Kilian Audroin',
    );
  });

  it('marks primary items', () => {
    fixture.componentRef.setInput('navItems', [
      { id: 1, label: 'Projets' },
      { id: 2, label: 'À propos', primary: true },
    ]);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons[0].classList).not.toContain('navbar-button-primary');
    expect(buttons[1].classList).toContain('navbar-button-primary');
  });

  it('links the name to the home page', () => {
    fixture.detectChanges();
    const title: HTMLAnchorElement = fixture.nativeElement.querySelector('.navbar-title');
    expect(title.getAttribute('href')).toBe('/');
  });

  it('marks the current item', () => {
    fixture.componentRef.setInput('navItems', [
      { id: 1, label: 'Projets', current: true },
      { id: 2, label: 'À propos' },
    ]);
    fixture.detectChanges();
    const current = fixture.nativeElement.querySelector('[aria-current="page"]');
    expect(current.tagName).toBe('SPAN');
    expect(current.classList).toContain('navbar-button-current');
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBe(1);
    expect(buttons[0].getAttribute('aria-current')).toBeNull();
  });
});
