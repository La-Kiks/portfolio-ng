import { ChangeDetectionStrategy, Component, OnInit, output, signal } from '@angular/core';

const LOADER_TTL_MS = 15 * 60 * 1000;
const LOADER_DURATION_MS = 1000;
export const MOBILE_QUERY = '(max-width: 599px)';

@Component({
  selector: 'app-loader',
  imports: [],
  templateUrl: './loader.html',
  styleUrl: './loader.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Loader implements OnInit {
  readonly loadingComplete = output<void>();
  readonly showLoader = signal(true);

  ngOnInit(): void {
    // Tablet/desktop use the bento entrance animation instead of the loader.
    if (!window.matchMedia(MOBILE_QUERY).matches) {
      this.showLoader.set(false);
      this.loadingComplete.emit();
      return;
    }

    const lastShown = Number(sessionStorage.getItem('loaderTimestamp') ?? 0);
    const now = Date.now();

    if (now - lastShown < LOADER_TTL_MS) {
      this.showLoader.set(false);
      this.loadingComplete.emit();
      return;
    }

    setTimeout(() => {
      this.showLoader.set(false);
      this.loadingComplete.emit();
      sessionStorage.setItem('loaderTimestamp', now.toString());
    }, LOADER_DURATION_MS);
  }
}
