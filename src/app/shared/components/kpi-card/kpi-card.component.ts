import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

export type KpiAccent = 'amber' | 'green' | 'red' | 'blue' | 'cyan' | 'purple' | 'neutral';

@Component({
  selector: 'ce-kpi-card',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card class="kpi-card" [class]="'accent-' + accent">
      <div class="kpi-label">{{ title }}</div>
      <div class="kpi-value">
        {{ value }}<span *ngIf="unit" class="kpi-unit">{{ unit }}</span>
      </div>
      <div class="kpi-delta" [class.delta-good]="deltaGood" [class.delta-bad]="!deltaGood && delta">
        <span *ngIf="delta">{{ delta }}</span>
      </div>
      <div class="kpi-sub">{{ subtitle }}</div>
    </mat-card>
  `,
  styles: [`
    .kpi-card {
      padding: 14px !important;
      cursor: pointer;
      transition: all 0.15s ease;
      position: relative;
      overflow: hidden;
      &::after {
        content: '';
        position: absolute; top: 0; left: 0; right: 0; height: 2px;
        background: var(--border);
        transition: background 0.15s;
      }
      &:hover { border-color: var(--amber) !important; transform: translateY(-1px); }
    }
    .accent-amber::after  { background: var(--amber)  !important; }
    .accent-green::after  { background: var(--green)  !important; }
    .accent-red::after    { background: var(--red)    !important; }
    .accent-blue::after   { background: var(--blue)   !important; }
    .accent-cyan::after   { background: var(--cyan)   !important; }
    .accent-purple::after { background: var(--purple) !important; }

    .kpi-label {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 8.5px; letter-spacing: 1.2px;
      text-transform: uppercase; color: var(--t3);
      margin-bottom: 8px;
    }
    .kpi-value {
      font-family: 'Rajdhani', sans-serif;
      font-size: 28px; font-weight: 700; line-height: 1;
      color: var(--t1);
    }
    .accent-amber .kpi-value { color: var(--amber); }
    .accent-green .kpi-value { color: var(--green); }
    .accent-red   .kpi-value { color: var(--red);   }
    .accent-blue  .kpi-value { color: var(--blue);  }
    .accent-cyan  .kpi-value { color: var(--cyan);  }
    .accent-purple .kpi-value { color: var(--purple); }

    .kpi-unit {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 10px; color: var(--t3); margin-left: 2px;
    }
    .kpi-delta {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 9px; margin-top: 5px;
      padding: 2px 6px; border-radius: 2px;
      display: inline-flex; align-items: center;
      color: var(--t3);
    }
    .delta-good { color: var(--green); background: rgba(46,204,113,.08); }
    .delta-bad  { color: var(--red);   background: rgba(231,76,60,.08); }
    .kpi-sub {
      font-size: 9.5px; color: var(--t2); margin-top: 4px;
    }
  `]
})
export class KpiCardComponent {
  @Input() title    = '';
  @Input() value    = '';
  @Input() unit     = '';
  @Input() delta    = '';
  @Input() deltaGood = true;
  @Input() subtitle = '';
  @Input() accent: KpiAccent = 'neutral';
}
