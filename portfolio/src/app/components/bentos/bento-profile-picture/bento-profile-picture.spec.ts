import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BentoProfilePicture } from './bento-profile-picture';

describe('BentoProfilePicture', () => {
  let component: BentoProfilePicture;
  let fixture: ComponentFixture<BentoProfilePicture>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BentoProfilePicture],
    }).compileComponents();

    fixture = TestBed.createComponent(BentoProfilePicture);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
