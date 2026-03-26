import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { ExportService } from '../../core/services/export.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';

@Component({
  selector: 'ce-ems-forecast',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatTableModule, PageHeaderComponent, KpiCardComponent],
  template: `
    <ce-page-header title="Energy Forecasting" subtitle="AI-DRIVEN · 12-MONTH HORIZON" highlight="NET-ZERO TRAJECTORY"
      (exportXlsx)="onExport('xlsx')" (exportPdf)="onExport('pdf')"></ce-page-header>
    <div class="grid-4">
      <ce-kpi-card title="2025 FORECAST" value="$2.61" unit="M" delta="▼ 8.1% vs 2024" [deltaGood]="true" subtitle="Total energy cost" accent="amber"></ce-kpi-card>
      <ce-kpi-card title="NET-ZERO TARGET" value="2038" delta="On track" [deltaGood]="true" subtitle="Carbon neutrality year" accent="green"></ce-kpi-card>
      <ce-kpi-card title="CARBON INTENSITY" value="41.2" unit="tCO₂/GWh" delta="▼ 6.8% YoY" [deltaGood]="true" subtitle="Emissions per energy unit" accent="blue"></ce-kpi-card>
      <ce-kpi-card title="CONFIDENCE" value="91" unit="%" delta="±4% range" [deltaGood]="true" subtitle="Model accuracy" accent="neutral"></ce-kpi-card>
    </div>
    <!-- Forecast chart SVG -->
    <mat-card style="padding:14px">
      <div class="ch"><span class="ct">ELECTRICITY FORECAST 2024→2025</span>
        <div style="display:flex;gap:10px">
          <span class="legend amber">— Actual 2024</span>
          <span class="legend blue">--- Forecast 2025</span>
          <span class="legend green">·· Net-zero</span>
        </div>
      </div>
      <div style="position:relative;height:150px;overflow:hidden;max-width:100%" [innerHTML]="chartSvgSafe"></div>
    </mat-card>
    <div class="grid-2">
      <mat-card style="padding:14px">
        <div class="ch"><span class="ct">ENERGY TYPE FORECAST 2025</span></div>
        <table mat-table [dataSource]="fcRows">
          <ng-container matColumnDef="type"><th mat-header-cell *matHeaderCellDef>TYPE</th><td mat-cell *matCellDef="let r">{{ r.type }}</td></ng-container>
          <ng-container matColumnDef="actual"><th mat-header-cell *matHeaderCellDef>2024 ACTUAL</th><td mat-cell *matCellDef="let r"><span class="mono">{{ r.actual }}</span></td></ng-container>
          <ng-container matColumnDef="forecast"><th mat-header-cell *matHeaderCellDef>2025 FORECAST</th><td mat-cell *matCellDef="let r"><span class="mono blue">{{ r.forecast }}</span></td></ng-container>
          <ng-container matColumnDef="change"><th mat-header-cell *matHeaderCellDef>CHANGE</th><td mat-cell *matCellDef="let r"><span class="mono green">{{ r.change }}</span></td></ng-container>
          <ng-container matColumnDef="cost"><th mat-header-cell *matHeaderCellDef>COST IMPACT</th><td mat-cell *matCellDef="let r"><span class="mono green">{{ r.cost }}</span></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="fcCols"></tr><tr mat-row *matRowDef="let r;columns:fcCols"></tr>
        </table>
      </mat-card>
      <mat-card style="padding:14px">
        <div class="ch"><span class="ct">NET-ZERO MILESTONES</span></div>
        <div class="milestone" *ngFor="let m of milestones">
          <span class="m-year">{{ m.year }}</span>
          <span class="m-label">{{ m.label }}</span>
          <span class="badge" [ngClass]="m.status==='On track'?'ok':m.status==='At risk'?'warn':'info'">{{ m.status }}</span>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`:host{display:flex;flex-direction:column;gap:14px;animation:fadeUp .25s ease}@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.ch{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.ct{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:1.2px;text-transform:uppercase;color:var(--t3)}.legend{font-family:'IBM Plex Mono',monospace;font-size:8.5px;&.amber{color:var(--amber)}&.blue{color:var(--blue)}&.green{color:var(--green)}}.mono{font-family:'IBM Plex Mono',monospace;font-size:9px;&.blue{color:var(--blue)}&.green{color:var(--green)}}.milestone{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border)}.m-year{font-family:'Rajdhani',sans-serif;font-size:17px;font-weight:700;color:var(--amber);width:40px}.m-label{flex:1;font-size:10.5px}`]
})
export class EmsForecastComponent {
  private exp = inject(ExportService);
  private san = inject(DomSanitizer);
  readonly fcCols = ['type','actual','forecast','change','cost'];
  readonly fcRows = [
    {type:'Electricity',actual:'4,820 MWh',forecast:'4,510 MWh',change:'-6.4%',cost:'-$37K'},
    {type:'Gas',actual:'1,240 MWh',forecast:'1,180 MWh',change:'-4.8%',cost:'-$5K'},
    {type:'Heating',actual:'680 MWh',forecast:'620 MWh',change:'-8.8%',cost:'-$4K'},
    {type:'Water',actual:'12,400 m³',forecast:'11,800 m³',change:'-4.8%',cost:'-$2K'},
    {type:'Motor Fuel',actual:'42,000 L',forecast:'38,500 L',change:'-8.3%',cost:'-$3K'},
    {type:'Coolants',actual:'8,200 L',forecast:'7,600 L',change:'-7.3%',cost:'-$5K'},
  ];
  readonly milestones = [
    {year:'2025',label:'RE electricity 30%',status:'On track'},
    {year:'2026',label:'Carbon intensity -20%',status:'On track'},
    {year:'2028',label:'Scope 2 net-zero',status:'At risk'},
    {year:'2030',label:'50% renewables',status:'Planned'},
    {year:'2035',label:'Scope 1 -60%',status:'Planned'},
    {year:'2038',label:'Carbon neutral',status:'Target'},
  ];
  get chartSvgSafe() { return this.san.bypassSecurityTrustHtml(this.chartSvg); }
  readonly chartSvg = `<svg width="100%" height="100%" viewBox="0 0 700 140" preserveAspectRatio="none">
    <line x1="0" y1="110" x2="700" y2="110" stroke="var(--border)" stroke-width=".5"/>
    <line x1="0" y1="75" x2="700" y2="75" stroke="var(--border)" stroke-width=".5"/>
    <line x1="0" y1="40" x2="700" y2="40" stroke="var(--border)" stroke-width=".5"/>
    <polyline points="0,90 58,83 116,77 174,85 232,67 290,63 348,70 406,60 464,75 522,55 580,67 638,60 700,65" fill="none" stroke="var(--amber)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="700,65 758,58 816,52 874,46 932,42 990,36" fill="none" stroke="var(--blue)" stroke-width="2" stroke-dasharray="6 3"/>
    <polygon points="700,58 758,51 816,45 874,39 932,35 990,29 990,43 932,49 874,53 816,59 758,65 700,72" fill="var(--blue)" opacity=".06"/>
    <line x1="0" y1="132" x2="700" y2="132" stroke="var(--green)" stroke-width=".8" stroke-dasharray="3 3" opacity=".5"/>
    <text x="5" y="129" font-family="IBM Plex Mono" font-size="7" fill="var(--green)" opacity=".6">NET ZERO</text>
  </svg>`;
  async onExport(fmt: 'xlsx'|'pdf') {
    await this.exp.export(fmt, this.fcRows as any,[
      {key:'type',label:'Energy Type',width:16},{key:'actual',label:'2024 Actual',width:16},
      {key:'forecast',label:'2025 Forecast',width:16},{key:'change',label:'Change',width:12},{key:'cost',label:'Cost Impact',width:14}
    ],'Cordant_EMS_Forecast','Energy Forecast','2025 projections');
  }
}
