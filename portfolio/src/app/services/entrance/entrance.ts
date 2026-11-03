import { Injectable } from '@angular/core';

/**
 * One-shot flag: the landing entrance animation plays only on the first
 * landing view after a full page load. Lives in memory, so a refresh resets it.
 */
@Injectable({ providedIn: 'root' })
export class EntranceService {
  private played = false;

  consume(): boolean {
    if (this.played) {
      return false;
    }
    this.played = true;
    return true;
  }
}
