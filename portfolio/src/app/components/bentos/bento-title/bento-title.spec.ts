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
});
