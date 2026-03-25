import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'ce-page-header',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule],
  template: `
    <div class="page-header">
      <div class="ph-left">
        <h1 class="ph-title">{{ title }}</h1>
        <p class="ph-sub">
          {{ subtitle }}
          <span *ngIf="highlight" class="ph-highlight">{{ highlight }}</span>
        </p>
      </div>
      <div class="ph-actions">
        <ng-content></ng-content>
        <button mat-stroked-button
                [matMenuTriggerFor]="exportMenu"
                class="export-btn"
                matTooltip="Export data">
          <mat-icon>download</mat-icon>
          Export
        </button>
        <mat-menu #exportMenu="matMenu" class="export-menu">
          <button mat-menu-item (click)="exportXlsx.emit()">
            <mat-icon>table_chart</mat-icon>
            <span>Export as Excel (.xlsx)</span>
          </button>
          <button mat-menu-item (click)="exportPdf.emit()">
            <mat-icon>picture_as_pdf</mat-icon>
            <span>Export as PDF</span>
          </button>
        </mat-menu>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex; align-items: flex-start;
      justify-content: space-between; gap: 16px;
      flex-wrap: wrap; padding-bottom: 4px;
    }
    .ph-title {
      font-family: 'Rajdhani', sans-serif;
      font-size: 24px; font-weight: 700;
      letter-spacing: 0.5px; color: var(--t1);
      margin: 0;
    }
    .ph-sub {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 9.5px; color: var(--t3);
      margin: 3px 0 0; letter-spacing: 0.3px;
    }
    .ph-highlight { color: var(--amber); }
    .ph-actions {
      display: flex; gap: 8px;
      align-items: center; flex-shrink: 0; flex-wrap: wrap;
    }
    .export-btn {
      font-family: 'IBM Plex Mono', monospace !important;
      font-size: 9.5px !important;
      border-color: var(--bright) !important;
      color: var(--t2) !important;
      height: 32px !important;
      &:hover {
        border-color: var(--amber) !important;
        color: var(--amber) !important;
      }
      mat-icon { font-size: 14px !important; height: 14px !important; width: 14px !important; }
    }
  `]
})
export class PageHeaderComponent {
  @Input() title     = '';
  @Input() subtitle  = '';
  @Input() highlight = '';
  @Output() exportXlsx = new EventEmitter<void>();
  @Output() exportPdf  = new EventEmitter<void>();
}
