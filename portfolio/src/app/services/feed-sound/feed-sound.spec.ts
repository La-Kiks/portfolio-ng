import { TestBed } from '@angular/core/testing';
import { FeedSound } from './feed-sound';

describe('FeedSound', () => {
  let sound: FeedSound;

  beforeEach(() => {
    sound = TestBed.inject(FeedSound);
  });

  it('starts on', () => {
    expect(sound.on()).toBe(true);
  });

  it('set() records the intent', () => {
    sound.set(false);
    expect(sound.on()).toBe(false);
    sound.set(true);
    expect(sound.on()).toBe(true);
  });

  it('toggle() flips the sound', () => {
    sound.toggle();
    expect(sound.on()).toBe(false);
    sound.toggle();
    expect(sound.on()).toBe(true);
  });
});
