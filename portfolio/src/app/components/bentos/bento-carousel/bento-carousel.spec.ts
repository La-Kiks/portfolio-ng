import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BentoCarousel } from './bento-carousel';

describe('BentoCarousel', () => {
  let component: BentoCarousel;
  let fixture: ComponentFixture<BentoCarousel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BentoCarousel],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(BentoCarousel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
