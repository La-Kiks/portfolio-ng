import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface CarouselProject {
  id: string;
  title: string;
  image: string;
  route: string;
}

@Component({
  selector: 'app-bento-carousel',
  imports: [CommonModule],
  templateUrl: './bento-carousel.html',
  styleUrl: './bento-carousel.scss',
})
export class BentoCarousel implements OnInit {
  @Input() projects: CarouselProject[] = [];

  currentIndex: number = 0;

  constructor(private router: Router) { }

  ngOnInit(): void {
    if (this.projects.length === 0) {
      console.warn('BentoCarousel: No projects provided');
    }
  }

  get currentProject(): CarouselProject {
    return this.projects[this.currentIndex];
  }

  previousProject(): void {
    this.currentIndex = (this.currentIndex - 1 + this.projects.length) % this.projects.length;
  }

  nextProject(): void {
    this.currentIndex = (this.currentIndex + 1) % this.projects.length;
  }

  goToProject(): void {
    if (this.currentProject.route) {
      this.router.navigate([this.currentProject.route]);
    }
  }

  goToSlide(index: number): void {
    this.currentIndex = index;
  }
}
