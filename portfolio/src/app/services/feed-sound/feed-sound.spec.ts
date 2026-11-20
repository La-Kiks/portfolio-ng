import { TestBed } from '@angular/core/testing';
import { FeedSound } from './feed-sound';

describe('FeedSound', () => {
  let sound: FeedSound;

  beforeEach(() => {
    sound = TestBed.inject(FeedSound);
  });

  it('starts off', () => {
    expect(sound.on()).toBe(false);
  });

  it('toggle() flips the sound', () => {
    sound.toggle();
    expect(sound.on()).toBe(true);
    sound.toggle();
    expect(sound.on()).toBe(false);
  });

  it('mute() turns the sound off', () => {
    sound.toggle();
    sound.mute();
    expect(sound.on()).toBe(false);
    sound.mute();
    expect(sound.on()).toBe(false);
  });
});
