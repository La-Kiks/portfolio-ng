import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { Observable, Subject, of, throwError } from 'rxjs';
import { ProjectList } from './project-list';
import { Project, ProjectService } from '../../../services/projects/project';

const PROJECTS: Project[] = [
  {
    id: '1',
    slug: 'alpha',
    title: 'Alpha',
    description: 'First',
    images: ['images/a-square.webp', 'images/a-wide.webp'],
    stack: ['Angular', '.NET', 'Stripe', 'Docker'],
  },
  { id: '2', slug: 'beta', title: 'Beta', description: 'Second', images: ['images/b.webp'] },
  { id: '3', slug: 'gamma', title: 'Gamma', description: 'Third', images: [] },
];

function setup(projects$: Observable<Project[]> = of(PROJECTS)) {
  TestBed.configureTestingModule({
    imports: [ProjectList],
    providers: [
      provideRouter([]),
      { provide: ProjectService, useValue: { getAllProjects: () => projects$ } },
    ],
  });
  const fixture = TestBed.createComponent(ProjectList);
  fixture.detectChanges();
  return fixture;
}

describe('ProjectList', () => {
  it('renders one linked card per project with an image', () => {
    const fixture = setup();
    const cards = fixture.nativeElement.querySelectorAll('a.project-card');
    expect(cards.length).toBe(2);
    expect(cards[0].getAttribute('href')).toBe('/projects/alpha');
    expect(cards[1].getAttribute('href')).toBe('/projects/beta');
    expect(fixture.nativeElement.textContent).not.toContain('Gamma');
  });

  it('prefers the wide image and falls back to the first one', () => {
    const fixture = setup();
    const images = fixture.nativeElement.querySelectorAll('a.project-card img');
    expect(images[0].getAttribute('src')).toContain('a-wide.webp');
    expect(images[1].getAttribute('src')).toContain('b.webp');
  });

  it('gives the card beside the wide first card its square image', () => {
    const twoImages = (id: string): Project => ({
      id,
      slug: id,
      title: id,
      description: id,
      images: [`images/${id}-square.webp`, `images/${id}-wide.webp`],
    });
    const fixture = setup(of([twoImages('a'), twoImages('b'), twoImages('c')]));
    const images = fixture.nativeElement.querySelectorAll('a.project-card img');
    expect(images[0].getAttribute('src')).toContain('a-wide.webp');
    expect(images[1].getAttribute('src')).toContain('b-square.webp');
    expect(images[2].getAttribute('src')).toContain('c-wide.webp');
  });

  it('shows at most three stack tags', () => {
    const fixture = setup();
    const card = fixture.nativeElement.querySelector('a.project-card');
    expect(card.querySelectorAll('.project-tag').length).toBe(3);
  });

  it('marks Projets as the current page and has one h1', () => {
    const fixture = setup();
    const current = fixture.nativeElement.querySelector('[aria-current="page"]');
    expect(current.textContent).toContain('Projets');
    expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(1);
  });

  it('goes home from the Accueil item', () => {
    const fixture = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.componentInstance.navItems.find((item) => item.label === 'Accueil')?.action?.();

    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('shows a loading message until the projects arrive', () => {
    const subject = new Subject<Project[]>();
    const fixture = setup(subject);
    expect(fixture.nativeElement.textContent).toContain('Chargement...');

    subject.next(PROJECTS);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Chargement...');
  });

  it('shows an error message when loading fails', () => {
    const fixture = setup(throwError(() => new Error('network')));
    expect(fixture.nativeElement.textContent).toContain('Impossible de charger les projets');
  });

  it('marks only the first card as featured', () => {
    const fixture = setup();
    const cards = fixture.nativeElement.querySelectorAll('a.project-card');
    expect(cards[0].classList).toContain('project-card-featured');
    expect(cards[1].classList).not.toContain('project-card-featured');
  });

  it('gives card images an empty alt', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('a.project-card img').getAttribute('alt')).toBe('');
  });
});
