import { Component } from '@angular/core';
import { LayoutComponent } from './layout/layout.component';

@Component({
  selector:    'ce-root',
  standalone:  true,
  imports:     [LayoutComponent],
  template:    `<ce-layout></ce-layout>`
})
export class AppComponent {}
