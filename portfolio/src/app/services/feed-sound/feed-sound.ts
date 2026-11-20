import { Injectable, signal } from '@angular/core';

/**
 * Whether the visitor wants the mobile feed reels to play with sound. Shared by
 * every reel, kept in memory only: each visit starts with sound on, and it only
 * turns off when the visitor mutes a reel.
 */
@Injectable({ providedIn: 'root' })
export class FeedSound {
  private readonly state = signal(true);
  readonly on = this.state.asReadonly();

  set(value: boolean): void {
    this.state.set(value);
  }

  toggle(): void {
    this.state.update((on) => !on);
  }
}
