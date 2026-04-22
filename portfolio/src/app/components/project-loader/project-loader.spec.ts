import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectLoader } from './project-loader';

describe('ProjectLoader', () => {
  let component: ProjectLoader;
  let fixture: ComponentFixture<ProjectLoader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectLoader],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectLoader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
