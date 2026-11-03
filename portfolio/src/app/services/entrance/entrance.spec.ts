import { TestBed } from '@angular/core/testing';
import { EntranceService } from './entrance';

describe('EntranceService', () => {
  it('returns true only on the first consume()', () => {
    const service = TestBed.inject(EntranceService);
    expect(service.consume()).toBe(true);
    expect(service.consume()).toBe(false);
    expect(service.consume()).toBe(false);
  });
});
