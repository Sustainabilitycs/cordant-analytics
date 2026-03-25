// ── EMS OPTIMIZATION ─────────────────────────────────────────────
import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { DataService } from '../../core/services/data.service';
import { ExportService } from '../../core/services/export.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';

@Component({
  selector: 'ce-ems-optimization',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatTableModule, PageHeaderComponent, KpiCardComponent],
  template: `
    <ce-page-header title="Energy Optimization" subtitle="PEAKS · ANOMALIES · COST REDUCTION" highlight="GUIDED ACTIONS"
      (exportXlsx)="onExport('xlsx')" (exportPdf)="onExport('pdf')"></ce-page-header>
    <div class="grid-4">
      <ce-kpi-card title="AVOIDABLE SPEND" value="$184K" unit="/yr" delta="Identified opportunities" [deltaGood]="true" subtitle="Cost reduction potential" accent="green"></ce-kpi-card>
      <ce-kpi-card title="PEAK EVENTS" [value]="peaks()" delta="This year" [deltaGood]="false" subtitle="Demand spike incidents" accent="red"></ce-kpi-card>
      <ce-kpi-card title="ANOMALY RATE" value="2.1" unit="%" delta="▼ 0.4% vs last quarter" [deltaGood]="true" subtitle="Of all sensor readings" accent="amber"></ce-kpi-card>
      <ce-kpi-card title="OUTAGES YTD" value="7" delta="3 unplanned" [deltaGood]="false" subtitle="Energy supply interruptions" accent="neutral"></ce-kpi-card>
    </div>
    <div class="grid-2">
      <mat-card style="padding:14px">
        <div class="ch"><span class="ct">GUIDED OPTIMIZATION ACTIONS</span><span class="badge crit">4 HIGH PRIORITY</span></div>
        <div class="action-list">
          <div class="action-item" *ngFor="let a of actions" [style.border-left-color]="a.color">
            <div class="action-top">
              <span class="action-icon">{{ a.icon }}</span>
              <div style="flex:1">
                <div class="action-title">{{ a.title }}</div>
                <div class="action-desc">{{ a.desc }}</div>
              </div>
              <div>
                <span class="badge" [ngClass]="a.pri==='HIGH'?'crit':a.pri==='MED'?'warn':'info'" [style.border-color]="a.color" [style.color]="a.color">{{ a.pri }}</span>
                <div class="saving">{{ a.saving }}</div>
              </div>
            </div>
          </div>
        </div>
      </mat-card>
      <mat-card style="padding:14px">
        <div class="ch"><span class="ct">OUTAGE & SUPPLY RISK TRACKER</span></div>
        <table mat-table [dataSource]="outages">
          <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>DATE</th><td mat-cell *matCellDef="let o"><span class="mono muted">{{ o.date }}</span></td></ng-container>
          <ng-container matColumnDef="plant"><th mat-header-cell *matHeaderCellDef>PLANT</th><td mat-cell *matCellDef="let o"><span class="mono amber">{{ o.plant }}</span></td></ng-container>
          <ng-container matColumnDef="energy"><th mat-header-cell *matHeaderCellDef>ENERGY</th><td mat-cell *matCellDef="let o"><span class="badge info">{{ o.energy }}</span></td></ng-container>
          <ng-container matColumnDef="dur"><th mat-header-cell *matHeaderCellDef>DURATION</th><td mat-cell *matCellDef="let o"><span class="mono" [style.color]="o.status==='Active'?'var(--red)':'var(--t2)'">{{ o.dur }}</span></td></ng-container>
          <ng-container matColumnDef="impact"><th mat-header-cell *matHeaderCellDef>IMPACT</th><td mat-cell *matCellDef="let o"><span class="mono" style="color:var(--red)">{{ o.impact }}</span></td></ng-container>
          <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>STATUS</th><td mat-cell *matCellDef="let o"><span class="badge" [ngClass]="o.status==='Active'?'crit':'ok'">{{ o.status }}</span></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="outCols"></tr>
          <tr mat-row *matRowDef="let r;columns:outCols"></tr>
        </table>
      </mat-card>
    </div>
  `,
  styles: [`:host{display:flex;flex-direction:column;gap:14px;animation:fadeUp .25s ease}@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.ch{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.ct{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:1.2px;text-transform:uppercase;color:var(--t3)}.mono{font-family:'IBM Plex Mono',monospace;font-size:9px;&.amber{color:var(--amber)}&.muted{color:var(--t3)}}.action-list{display:flex;flex-direction:column;gap:6px}.action-item{padding:9px;background:var(--el);border-radius:3px;border-left:2px solid var(--border)}.action-top{display:flex;gap:10px;align-items:flex-start}.action-icon{font-size:16px;flex-shrink:0}.action-title{font-size:11px;font-weight:500;margin-bottom:2px}.action-desc{font-size:9px;color:var(--t2)}.saving{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--green);margin-top:3px;text-align:right}`]
})
export class EmsOptimizationComponent {
  private dataS = inject(DataService); private exp = inject(ExportService);
  readonly outCols = ['date','plant','energy','dur','impact','status'];
  peaks() { return this.dataS.energyMonthly.reduce((s,r)=>s+r.spike_count,0).toString(); }
  readonly actions = [
    {pri:'HIGH',icon:'⚡',title:'Peak demand shaving — CE-PL01-CO-MO',desc:'Large motors contributing 34% of peak events. Stagger start-up sequences.',saving:'$42K/yr',color:'var(--red)'},
    {pri:'HIGH',icon:'💧',title:'Water anomaly — CE-PL03-SE-PU',desc:'Separator pumps using 28% more water than baseline. Check seal leaks.',saving:'$18K/yr',color:'var(--red)'},
    {pri:'MED',icon:'🔥',title:'Heating inefficiency — CE-PL02-PR-VA',desc:'Control valves showing higher heating in winter. Insulation upgrade recommended.',saving:'$31K/yr',color:'var(--amber)'},
    {pri:'MED',icon:'⚙',title:'Motor idle detection — CE-PL01-PR-MO',desc:'12 small motors running at no-load 30% of time. Install VFDs or auto-shutdown.',saving:'$55K/yr',color:'var(--amber)'},
    {pri:'LOW',icon:'❄',title:'Coolant optimisation — Large motors',desc:'Coolant system above necessary temperature. Setpoint adjustment saves energy.',saving:'$22K/yr',color:'var(--blue)'},
    {pri:'LOW',icon:'🌱',title:'Renewable offset — PL04',desc:'PL04 Water Treatment suited for solar + storage. ROI estimate 4.2 years.',saving:'$16K/yr',color:'var(--green)'},
  ];
  readonly outages = [
    {date:'2024-08-14',plant:'CE-PL02',energy:'Electricity',dur:'2h 34m',impact:'$12,400',status:'Closed'},
    {date:'2024-11-09',plant:'CE-PL03',energy:'Electricity',dur:'Ongoing',impact:'TBD',status:'Active'},
    {date:'2024-06-03',plant:'CE-PL01',energy:'Gas',dur:'45min',impact:'$3,200',status:'Closed'},
    {date:'2024-04-22',plant:'CE-PL04',energy:'Water',dur:'1h 10m',impact:'$1,800',status:'Closed'},
    {date:'2024-02-18',plant:'CE-PL01',energy:'Heating',dur:'4h',impact:'$8,600',status:'Closed'},
  ];
  async onExport(fmt: 'xlsx'|'pdf') {
    await this.exp.export(fmt, this.outages as any,[
      {key:'date',label:'Date',width:14},{key:'plant',label:'Plant',width:14},
      {key:'energy',label:'Energy Type',width:16},{key:'dur',label:'Duration',width:12},
      {key:'impact',label:'Impact $',width:14},{key:'status',label:'Status',width:12}
    ],'Cordant_EMS_Optimization','Energy Optimization','Outages & guided actions');
  }
}
