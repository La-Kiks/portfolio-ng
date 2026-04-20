import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bento-title-description',
  imports: [CommonModule],
  templateUrl: './bento-title-description.html',
  styleUrl: './bento-title-description.scss',
})
export class BentoTitleDescription {
  @Input() title: string = 'Title';
  @Input() description: string = 'Add your description here';
}
