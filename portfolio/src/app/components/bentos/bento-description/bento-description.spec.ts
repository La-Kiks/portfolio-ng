import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BentoDescription } from './bento-description';

describe('BentoDescription', () => {
  let component: BentoDescription;
  let fixture: ComponentFixture<BentoDescription>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BentoDescription],
    }).compileComponents();

    fixture = TestBed.createComponent(BentoDescription);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
