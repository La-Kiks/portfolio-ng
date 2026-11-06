import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BentoSocial } from './bento-social';

describe('BentoSocial', () => {
  let component: BentoSocial;
  let fixture: ComponentFixture<BentoSocial>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BentoSocial],
    }).compileComponents();

    fixture = TestBed.createComponent(BentoSocial);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders one link per social link', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('a').length).toBe(4);
  });

  it('renders the first link as the dark card and the others as light cards', () => {
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll('a');
    expect(links[0].classList).toContain('bento-card-ink');
    expect(links[1].classList).toContain('bento-card');
    expect(links[1].classList).not.toContain('bento-card-ink');
  });
});
