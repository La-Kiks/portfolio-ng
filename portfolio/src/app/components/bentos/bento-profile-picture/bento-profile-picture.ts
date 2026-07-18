import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-bento-profile-picture',
  imports: [],
  templateUrl: './bento-profile-picture.html',
  styleUrl: './bento-profile-picture.scss',
})
export class BentoProfilePicture {
  @Input() imageUrl = '/images/profile.jpg';
  @Input() altText = 'Profile picture';
}
