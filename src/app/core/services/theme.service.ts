import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  readonly isDark = signal<boolean>(true);

  constructor() {
    const saved = localStorage.getItem('cordant-theme');
    if (saved === 'light') {
      this.isDark.set(false);
      document.body.classList.add('light-theme');
    }
  }

  toggle(): void {
    const nowDark = !this.isDark();
    this.isDark.set(nowDark);
    if (nowDark) {
      document.body.classList.remove('light-theme');
      localStorage.setItem('cordant-theme', 'dark');
    } else {
      document.body.classList.add('light-theme');
      localStorage.setItem('cordant-theme', 'light');
    }
  }
}
