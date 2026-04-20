import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private currentTheme = 'light';

    constructor() {
        this.loadTheme();
    }

    setTheme(theme: 'light' | 'dark'): void {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    getTheme(): string {
        return this.currentTheme;
    }

    private loadTheme(): void {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
        this.setTheme(savedTheme);
    }

    toggleTheme(): void {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
}