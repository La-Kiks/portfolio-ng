import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-loader',
  imports: [],
  templateUrl: './loader.html',
  styleUrl: './loader.scss',
})
export class Loader implements OnInit {
  @Output() loadingComplete = new EventEmitter<void>();

  showLoader: boolean = true;

  ngOnInit(): void {
    const loaderTimestamp = sessionStorage.getItem('loaderTimestamp');
    const now = Date.now();
    const FIFTEEN_MINUTES = 15 * 60 * 1000;


    if (loaderTimestamp) {
      const timeSinceLastLoader = now - parseInt(loaderTimestamp);

      if (timeSinceLastLoader < FIFTEEN_MINUTES) {
        this.showLoader = false;
        this.loadingComplete.emit();
      } else {
        this.showLoader = true;
        setTimeout(() => {
          this.showLoader = false;
          this.loadingComplete.emit();
          sessionStorage.setItem('loaderTimestamp', now.toString());
        }, 1000);
      }
    } else {
      this.showLoader = true;
      setTimeout(() => {
        this.showLoader = false;
        this.loadingComplete.emit();
        sessionStorage.setItem('loaderTimestamp', now.toString());
      }, 1000);
    }
  }
}
