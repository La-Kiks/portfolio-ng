import { Injectable, signal } from '@angular/core';

/**
 * Whether the mobile feed reels play with sound. Shared by every reel, kept in
 * memory only: each visit starts muted, as browsers require for autoplay.
 */
@Injectable({ providedIn: 'root' })
export class FeedSound {
  private readonly state = signal(false);
  readonly on = this.state.asReadonly();

  toggle(): void {
    this.state.update((on) => !on);
  }

  mute(): void {
    this.state.set(false);
  }
}
