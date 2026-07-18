import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-bento-title',
  imports: [],
  templateUrl: './bento-title.html',
  styleUrl: './bento-title.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BentoTitle {
  readonly title = input('Title');
}
