import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bento-profile-picture',
  imports: [],
  templateUrl: './bento-profile-picture.html',
  styleUrl: './bento-profile-picture.scss',
})
export class BentoProfilePicture {
  @Input() imageUrl: string = '/images/profile.jpg';
  @Input() altText: string = 'Profile picture';
}
