import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BentoCarousel } from './bento-carousel';

const PROJECTS = [
  { id: '1', slug: 'one', title: 'One', description: 'First', images: ['/img/1.webp'] },
  { id: '2', slug: 'two', title: 'Two', description: 'Second', images: ['/img/2.webp'] },
  { id: '3', slug: 'three', title: 'Three', description: 'Third', images: ['/img/3.webp'] },
];

describe('BentoCarousel', () => {
  let component: BentoCarousel;
  let fixture: ComponentFixture<BentoCarousel>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BentoCarousel],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(BentoCarousel);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit -> load
  });

  function flushProjects(): void {
    httpMock.expectOne('/files/projects.json').flush(PROJECTS);
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

  it('shows a visible error message when loading fails', () => {
    httpMock.expectOne('/files/projects.json').error(new ProgressEvent('error'));
    fixture.detectChanges();
    expect(component.hasError()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Impossible de charger les projets');
  });
});
