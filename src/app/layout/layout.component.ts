import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../core/services/theme.service';

interface NavItem {
  route:   string;
  label:   string;
  icon:    string;
  dotColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'ce-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <!-- ── NAV BAR ── -->
    <nav class="topnav">
      <div class="nav-logo">
        <div class="logo-hex">C</div>
        <span class="logo-text"><span class="amber">C</span>ORDANT</span>
      </div>

      <div class="nav-tabs">
        <a class="nav-tab" routerLink="/dashboard"        routerLinkActive="active">
          <span class="dot dot-green"></span>DASHBOARD
        </a>
        <a class="nav-tab" routerLink="/assets"           routerLinkActive="active">
          <span class="dot dot-blue"></span>ASSETS
        </a>
        <a class="nav-tab" routerLink="/ems/consumption"  routerLinkActive="active">
          <span class="dot dot-green"></span>EMS
        </a>
        <a class="nav-tab" routerLink="/ems/water"        routerLinkActive="active">
          <span class="dot dot-cyan"></span>WATER
        </a>
        <a class="nav-tab" routerLink="/ems/overview"     routerLinkActive="active">
          <span class="dot dot-purple"></span>OVERVIEW
        </a>
        <a class="nav-tab" routerLink="/strategies"       routerLinkActive="active">
          <span class="dot dot-amber"></span>STRATEGIES
        </a>
        <a class="nav-tab" routerLink="/work-orders"      routerLinkActive="active">
          <span class="dot dot-cyan"></span>WORK ORDERS
        </a>
        <a class="nav-tab" routerLink="/sensor"           routerLinkActive="active">
          <span class="dot dot-red"></span>SENSOR
        </a>
        <a class="nav-tab" routerLink="/floc"             routerLinkActive="active">
          <span class="dot dot-blue"></span>PLANT
        </a>
        <a class="nav-tab" routerLink="/audit"            routerLinkActive="active">
          <span class="dot dot-amber"></span>AUDIT
        </a>
        <a class="nav-tab" routerLink="/ai"               routerLinkActive="active">
          <span class="dot dot-cyan"></span>AI
        </a>
        <a class="nav-tab" routerLink="/integrations"     routerLinkActive="active">
          <span class="dot dot-blue"></span>INTEGRATIONS
        </a>
      </div>

      <div class="nav-right">
        <div class="nav-badge">RCM v2.4</div>
        <div class="live-pill"><div class="live-dot"></div>LIVE</div>
        <button class="theme-btn" (click)="themeService.toggle()"
                [matTooltip]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'">
          {{ themeService.isDark() ? '🌙' : '☀️' }}
        </button>
        <div class="nav-avatar">CE</div>
      </div>
    </nav>

    <!-- ── APP SHELL ── -->
    <div class="app-shell">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sb-section">Overview</div>
        <a class="sb-item" routerLink="/dashboard"   routerLinkActive="active"><span class="sb-icon">◉</span>Dashboard</a>
        <a class="sb-item" routerLink="/assets"      routerLinkActive="active"><span class="sb-icon">⬡</span>Asset Register<span class="sb-count">500</span></a>

        <div class="sb-section">EMS Analytics</div>
        <a class="sb-item" routerLink="/ems/consumption" routerLinkActive="active"><span class="sb-icon">⚡</span>Consumption</a>
        <a class="sb-item" routerLink="/ems/optimization"routerLinkActive="active"><span class="sb-icon">◎</span>Optimization</a>
        <a class="sb-item" routerLink="/ems/forecast"    routerLinkActive="active"><span class="sb-icon">⤴</span>Forecasting</a>
        <a class="sb-item" routerLink="/ems/analytics"   routerLinkActive="active"><span class="sb-icon">∑</span>Analytics</a>
        <a class="sb-item" routerLink="/ems/water"       routerLinkActive="active"><span class="sb-icon">💧</span>Water</a>
        <a class="sb-item" routerLink="/ems/overview"    routerLinkActive="active"><span class="sb-icon">⊛</span>EMS Overview</a>

        <div class="sb-section">Maintenance</div>
        <a class="sb-item" routerLink="/strategies"  routerLinkActive="active"><span class="sb-icon">⊞</span>Strategy Library</a>
        <a class="sb-item" routerLink="/work-orders" routerLinkActive="active"><span class="sb-icon">⊡</span>Work Orders</a>
        <a class="sb-item" routerLink="/sensor"      routerLinkActive="active"><span class="sb-icon">△</span>Sensor Feed</a>

        <div class="sb-section">Plant</div>
        <a class="sb-item" routerLink="/floc"        routerLinkActive="active"><span class="sb-icon">◻</span>FLOC Hierarchy</a>

        <div class="sb-section">Governance</div>
        <a class="sb-item" routerLink="/audit"       routerLinkActive="active"><span class="sb-icon">◈</span>Audit Trail</a>
        <a class="sb-item" routerLink="/ai"          routerLinkActive="active"><span class="sb-icon">☆</span>AI Assistant</a>

        <div class="sb-section">System</div>
        <a class="sb-item" routerLink="/integrations"routerLinkActive="active"><span class="sb-icon">⊕</span>Integrations</a>

        <div class="sb-footer">
          <span class="font-mono" style="font-size:7.5px;color:var(--t3)">CORDANT ENERGY v2.0</span>
        </div>
      </aside>

      <!-- Main content -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    /* ── TOP NAV ── */
    .topnav {
      position: sticky; top: 0; z-index: 100;
      background: rgba(10,12,15,.97);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center;
      padding: 0 16px; height: 52px; gap: 0;
      overflow-x: auto;
    }
    :host-context(.light-theme) .topnav { background: rgba(228,232,240,.97); }

    .nav-logo {
      display: flex; align-items: center; gap: 8px;
      margin-right: 20px; flex-shrink: 0;
    }
    .logo-hex {
      width: 28px; height: 28px; background: var(--amber);
      clip-path: polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; color: #000;
      font-family: 'Rajdhani', sans-serif;
    }
    .logo-text {
      font-family: 'Rajdhani', sans-serif;
      font-size: 17px; font-weight: 700; letter-spacing: 2px;
      color: var(--t1); white-space: nowrap;
      .amber { color: var(--amber); }
    }
    .nav-tabs { display: flex; height: 100%; overflow-x: auto; }
    .nav-tab {
      display: flex; align-items: center; gap: 4px;
      padding: 0 11px; font-size: 10px; font-weight: 500;
      letter-spacing: .4px; color: var(--t3);
      text-decoration: none; border-bottom: 2px solid transparent;
      transition: all .15s; font-family: 'IBM Plex Mono', monospace;
      text-transform: uppercase; white-space: nowrap; flex-shrink: 0;
      &:hover { color: var(--t2); }
      &.active { color: var(--amber); border-bottom-color: var(--amber); }
    }
    .dot {
      width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
      &.dot-green  { background: var(--green);  box-shadow: 0 0 4px var(--green); animation: pulse 2s infinite; }
      &.dot-amber  { background: var(--amber); }
      &.dot-blue   { background: var(--blue); }
      &.dot-red    { background: var(--red); }
      &.dot-cyan   { background: var(--cyan); }
      &.dot-purple { background: var(--purple); }
    }
    @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.3} }
    .nav-right {
      margin-left: auto; display: flex; align-items: center;
      gap: 8px; flex-shrink: 0;
    }
    .nav-badge {
      font-family: 'IBM Plex Mono', monospace; font-size: 8px;
      padding: 2px 6px; border-radius: 2px;
      background: var(--amberG); border: 1px solid var(--amberD);
      color: var(--amber); letter-spacing: 1px;
    }
    .live-pill {
      display: flex; align-items: center; gap: 3px;
      font-family: 'IBM Plex Mono', monospace; font-size: 8px;
      color: var(--green); letter-spacing: 1px;
    }
    .live-dot {
      width: 5px; height: 5px; border-radius: 50%;
      background: var(--green); animation: pulse 1.5s infinite;
    }
    .theme-btn {
      background: none; border: 1px solid var(--bright);
      border-radius: 20px; padding: 3px 8px;
      cursor: pointer; font-size: 14px; color: var(--t2);
      transition: all .2s; line-height: 1.4;
      &:hover { border-color: var(--amber); }
    }
    .nav-avatar {
      width: 26px; height: 26px; border-radius: 50%;
      background: var(--amber); display: flex; align-items: center;
      justify-content: center; font-size: 10px; font-weight: 700;
      color: #000; font-family: 'Rajdhani', sans-serif;
    }

    /* ── APP SHELL ── */
    .app-shell {
      display: grid; grid-template-columns: 190px 1fr;
      height: calc(100vh - 52px); overflow: hidden;
    }
    @media (max-width: 900px) {
      .app-shell { grid-template-columns: 1fr; }
      .sidebar { display: none; }
    }

    /* ── SIDEBAR ── */
    .sidebar {
      background: var(--bg2); border-right: 1px solid var(--border);
      padding: 10px 0; display: flex; flex-direction: column;
      overflow-y: auto; position: sticky; top: 52px;
    }
    .sb-section {
      font-family: 'IBM Plex Mono', monospace; font-size: 8.5px;
      letter-spacing: 2px; color: var(--t3); text-transform: uppercase;
      padding: 10px 12px 4px;
    }
    .sb-item {
      display: flex; align-items: center; gap: 7px;
      padding: 6px 12px; font-size: 11px; color: var(--t2);
      cursor: pointer; transition: all .12s;
      border-left: 2px solid transparent; text-decoration: none;
      &:hover { color: var(--t1); background: var(--el); }
      &.active { color: var(--amber); border-left-color: var(--amber); background: var(--amberG); }
    }
    .sb-icon { font-size: 12px; width: 14px; text-align: center; flex-shrink: 0; }
    .sb-count {
      margin-left: auto; font-family: 'IBM Plex Mono', monospace;
      font-size: 8px; padding: 1px 4px; border-radius: 2px;
      background: rgba(231,76,60,.15); color: var(--red);
    }
    .sb-footer {
      margin-top: auto; padding: 12px;
      border-top: 1px solid var(--border);
    }

    /* ── MAIN CONTENT ── */
    .main-content {
      overflow-y: auto; padding: 20px;
      display: flex; flex-direction: column; gap: 16px;
      background: var(--bg);
    }
    @media (max-width: 600px) { .main-content { padding: 12px; } }
  `]
})
export class LayoutComponent {
  readonly themeService = inject(ThemeService);
}
