import { TestBed } from '@angular/core/testing';
import { FeedPosition } from './feed-position';

describe('FeedPosition', () => {
  it('starts at the intro and remembers the stored index', () => {
    const service = TestBed.inject(FeedPosition);
    expect(service.index).toBe(0);
    service.index = 3;
    expect(TestBed.inject(FeedPosition).index).toBe(3);
  });
});
