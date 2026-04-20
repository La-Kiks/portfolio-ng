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
});
