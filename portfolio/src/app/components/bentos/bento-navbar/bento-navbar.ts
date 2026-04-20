import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeToggle } from '../../theme-toggle/theme-toggle';

interface NavItem {
  label: string;
  action?: () => void;
}

@Component({
  selector: 'app-bento-navbar',
  standalone: true,
  imports: [CommonModule, ThemeToggle],
  templateUrl: './bento-navbar.html',
  styleUrls: ['./bento-navbar.scss']
})
export class BentoNavbar {
  @Input() title: string = 'My Portfolio';
  @Input() navItems: NavItem[] = [];
}