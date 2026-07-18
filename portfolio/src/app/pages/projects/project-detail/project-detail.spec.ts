import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProjectDetail } from './project-detail';

const PROJECTS = [
  {
    id: '1',
    slug: 'sport-event',
    title: 'Sport Event',
    description: 'Une plateforme sportive',
    images: ['/a.webp', '/b.webp'],
  },
];

describe('ProjectDetail', () => {
  let fixture: ComponentFixture<ProjectDetail>;
  let httpMock: HttpTestingController;

  function setup(slug: string): void {
    TestBed.configureTestingModule({
      imports: [ProjectDetail],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { params: of({ slug }) } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProjectDetail);
    fixture.detectChanges();
  }

  it('renders the project and sets title and meta description', () => {
    setup('sport-event');
    httpMock.expectOne('/files/projects.json').flush(PROJECTS);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sport Event');
    expect(TestBed.inject(Title).getTitle()).toBe('Sport Event — Kilian Audroin');
    const description = document.querySelector('meta[name="description"]');
    expect(description?.getAttribute('content')).toBe('Une plateforme sportive');
  });

  it('shows the not-found error for an unknown slug', () => {
    setup('does-not-exist');
    httpMock.expectOne('/files/projects.json').flush(PROJECTS);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Project not found');
  });

  it('shows the error state when the request fails', () => {
    setup('sport-event');
    httpMock.expectOne('/files/projects.json').error(new ProgressEvent('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Error loading project');
  });
});
