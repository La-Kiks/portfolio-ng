import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface NavItem {
  label: string;
  action?: () => void;
}

@Component({
  selector: 'app-bento-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bento-navbar.html',
  styleUrls: ['./bento-navbar.scss']
})
export class BentoNavbar {
  @Input() title: string = 'My Portfolio';
  @Input() navItems: NavItem[] = [];
}