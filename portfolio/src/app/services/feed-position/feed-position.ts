import { Injectable } from '@angular/core';

/**
 * Remembers which mobile feed screen was in view so returning from a project
 * detail page restores it. Lives in memory, so a refresh starts at the intro.
 */
@Injectable({ providedIn: 'root' })
export class FeedPosition {
  index = 0;
}
