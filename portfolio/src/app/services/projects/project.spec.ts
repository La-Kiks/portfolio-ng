import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Project, ProjectService } from './project';
import { makeProject } from '../../../testing/project-fixture';

const PROJECTS: Project[] = [
  makeProject({ id: '1', slug: 'sport-event', title: 'Sport Event', description: 'Desc 1' }),
  makeProject({ id: '2', slug: 'menu-maker', title: 'Menu Maker', description: 'Desc 2' }),
];

describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('returns all projects', () => {
    let result: Project[] | undefined;
    service.getAllProjects().subscribe(p => (result = p));
    httpMock.expectOne('files/projects.json').flush(PROJECTS);
    expect(result).toEqual(PROJECTS);
  });

  it('finds a project by slug', () => {
    let result: Project | undefined;
    service.getProjectBySlug('menu-maker').subscribe(p => (result = p));
    httpMock.expectOne('files/projects.json').flush(PROJECTS);
    expect(result?.title).toBe('Menu Maker');
  });

  it('exposes the video of a project by slug', () => {
    let result: Project | undefined;
    service.getProjectBySlug('a').subscribe(p => (result = p));
    httpMock.expectOne('files/projects.json').flush([makeProject({ slug: 'a' })]);
    expect(result?.video.posterLandscape).toBe('videos/demo/landscape.webp');
  });

  it('returns undefined for an unknown slug', () => {
    let result: Project | undefined = PROJECTS[0];
    service.getProjectBySlug('nope').subscribe(p => (result = p));
    httpMock.expectOne('files/projects.json').flush(PROJECTS);
    expect(result).toBeUndefined();
  });

  it('caches: two consumers trigger a single HTTP request', () => {
    service.getAllProjects().subscribe();
    service.getProjectBySlug('sport-event').subscribe();
    const requests = httpMock.match('files/projects.json');
    expect(requests.length).toBe(1);
    requests[0].flush(PROJECTS);
  });
});
