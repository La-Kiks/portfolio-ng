import { ChangeDetectionStrategy, Component, OnInit, output, signal } from '@angular/core';

const DURATION_MS = 800;
const TICK_MS = 20;

@Component({
  selector: 'app-project-loader',
  imports: [],
  templateUrl: './project-loader.html',
  styleUrl: './project-loader.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectLoader implements OnInit {
  readonly loadingComplete = output<void>();
  readonly showLoader = signal(true);
  readonly loadingProgress = signal(0);

  ngOnInit(): void {
    const step = 100 / (DURATION_MS / TICK_MS);

    const progressInterval = setInterval(() => {
      this.loadingProgress.update(progress => Math.min(progress + step, 100));

      if (this.loadingProgress() >= 100) {
        clearInterval(progressInterval);
        setTimeout(() => {
          this.showLoader.set(false);
          this.loadingComplete.emit();
        }, 100);
      }
    }, TICK_MS);
  }
}
