import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-bento-profile-picture',
  imports: [NgOptimizedImage],
  templateUrl: './bento-profile-picture.html',
  styleUrl: './bento-profile-picture.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BentoProfilePicture {
  readonly imageUrl = input('/images/profile.jpg');
  readonly altText = input('Profile picture');
}
