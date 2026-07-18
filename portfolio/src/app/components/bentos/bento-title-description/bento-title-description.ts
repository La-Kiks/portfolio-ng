import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bento-title-description',
  imports: [CommonModule],
  templateUrl: './bento-title-description.html',
  styleUrl: './bento-title-description.scss',
})
export class BentoTitleDescription {
  @Input() title = 'Title';
  @Input() description = 'Add your description here';
}
