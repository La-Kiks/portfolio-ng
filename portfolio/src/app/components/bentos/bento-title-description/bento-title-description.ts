import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-bento-title-description',
  imports: [],
  templateUrl: './bento-title-description.html',
  styleUrl: './bento-title-description.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BentoTitleDescription {
  readonly title = input('Title');
  readonly description = input('Add your description here');
}
