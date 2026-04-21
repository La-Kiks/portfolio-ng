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
    setTimeout(() => {
      this.showLoader = false;
      this.loadingComplete.emit();
    }, 1000);
  }
}
