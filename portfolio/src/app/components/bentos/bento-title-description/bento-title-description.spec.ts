import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BentoTitleDescription } from './bento-title-description';

describe('BentoTitleDescription', () => {
  let component: BentoTitleDescription;
  let fixture: ComponentFixture<BentoTitleDescription>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BentoTitleDescription],
    }).compileComponents();

    fixture = TestBed.createComponent(BentoTitleDescription);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
