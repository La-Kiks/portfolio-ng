import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface NavItem {
  id: number;
  label: string;
  action?: () => void;
}

@Component({
  selector: 'app-bento-navbar',
  imports: [],
  templateUrl: './bento-navbar.html',
  styleUrl: './bento-navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BentoNavbar {
  readonly title = input('My Portfolio');
  readonly navItems = input<NavItem[]>([]);
}