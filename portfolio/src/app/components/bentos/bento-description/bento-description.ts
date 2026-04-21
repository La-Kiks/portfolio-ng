import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-bento-description',
  imports: [],
  templateUrl: './bento-description.html',
  styleUrl: './bento-description.scss',
})
export class BentoDescription {
  @Input() description: string = 'Description';
}
