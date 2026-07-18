import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-bento-description',
  imports: [],
  templateUrl: './bento-description.html',
  styleUrl: './bento-description.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BentoDescription {
  readonly description = input('Description');
}
