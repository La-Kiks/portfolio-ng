import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectLoader } from '../../components/project-loader/project-loader';

@Component({
  selector: 'app-about',
  imports: [RouterLink, ProjectLoader],
  templateUrl: './about.html',
  styleUrl: './about.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {
  readonly showProjectLoader = signal(true);

  onProjectLoaderComplete(): void {
    this.showProjectLoader.set(false);
  }
}
