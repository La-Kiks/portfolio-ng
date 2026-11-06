import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface NavItem {
  id: number;
  label: string;
  action?: () => void;
  primary?: boolean;
  current?: boolean;
}

@Component({
  selector: 'app-bento-navbar',
  imports: [RouterLink],
  templateUrl: './bento-navbar.html',
  styleUrl: './bento-navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BentoNavbar {
  readonly title = input('My Portfolio');
  readonly navItems = input<NavItem[]>([]);
}