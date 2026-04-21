import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-bento-title',
  imports: [],
  templateUrl: './bento-title.html',
  styleUrl: './bento-title.scss',
})
export class BentoTitle {
  @Input() title: string = 'Title';
}
