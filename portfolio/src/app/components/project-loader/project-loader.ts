import { Component, OnInit, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-project-loader',
  imports: [],
  templateUrl: './project-loader.html',
  styleUrl: './project-loader.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProjectLoader implements OnInit {
  @Output() loadingComplete = new EventEmitter<void>();

  showLoader: boolean = true;
  loadingProgress: number = 0;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    const duration = 800;
    const interval = 20;
    const steps = duration / interval;
    const step = 100 / steps;
    let currentStep = 0;

    const progressInterval = setInterval(() => {
      currentStep++;
      this.loadingProgress = Math.min(currentStep * step, 100);
      this.cdr.markForCheck();

      if (this.loadingProgress >= 100) {
        clearInterval(progressInterval);

        setTimeout(() => {
          this.showLoader = false;
          this.cdr.markForCheck();
          this.loadingComplete.emit();
        }, 100);
      }
    }, interval);
  }

}
