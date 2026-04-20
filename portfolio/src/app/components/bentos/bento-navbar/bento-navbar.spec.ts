import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BentoNavbar } from './bento-navbar';

describe('BentoNavbar', () => {
  let component: BentoNavbar;
  let fixture: ComponentFixture<BentoNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BentoNavbar],
    }).compileComponents();

    fixture = TestBed.createComponent(BentoNavbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
