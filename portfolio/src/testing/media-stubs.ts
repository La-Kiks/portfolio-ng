import { vi, type Mock } from 'vitest';

/** jsdom lacks HTMLMediaElement.play/pause: spy on the prototype (play resolves). */
export function stubMedia(): { play: Mock; pause: Mock } {
  const play = vi
    .spyOn(HTMLMediaElement.prototype, 'play')
    .mockImplementation(() => Promise.resolve());
  const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  return { play, pause };
}

/** jsdom lacks window.matchMedia: answer every query through `matches`. */
export function stubMatchMedia(matches: (query: string) => boolean): void {
  vi.stubGlobal(
    'matchMedia',
    (query: string): Partial<MediaQueryList> => ({
      matches: matches(query),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  );
}
