import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BentoTitle } from './bento-title';

describe('BentoTitle', () => {
  let component: BentoTitle;
  let fixture: ComponentFixture<BentoTitle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BentoTitle],
    }).compileComponents();

    fixture = TestBed.createComponent(BentoTitle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the title as the page heading', () => {
    fixture.componentRef.setInput('title', 'Web developer');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Web developer');
  });
});
