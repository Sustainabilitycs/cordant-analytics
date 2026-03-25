// ── SENSOR FEED ──────────────────────────────────────────────────
import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../../core/services/data.service';
import { ExportService } from '../../core/services/export.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';

@Component({
  selector: 'ce-sensor',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatTableModule,
    MatFormFieldModule, MatInputModule, MatIconModule, PageHeaderComponent, KpiCardComponent],
  template: `
    <ce-page-header title="Sensor Feed" subtitle="TEMPERATURE · VIBRATION · PRESSURE · CO₂" highlight="15-MIN & DAILY"
      (exportXlsx)="onExportXlsx()" (exportPdf)="onExportPdf()"></ce-page-header>
    <div class="grid-4">
      <ce-kpi-card title="ASSETS MONITORED" value="65" subtitle="PU, MO, TR classes" accent="green"></ce-kpi-card>
      <ce-kpi-card title="ACTIVE ALERTS" [value]="alerts()" subtitle="YTD sensor events" accent="red"></ce-kpi-card>
      <ce-kpi-card title="MAX TEMPERATURE" [value]="maxTemp()" unit="°C" subtitle="Peak reading" accent="amber"></ce-kpi-card>
      <ce-kpi-card title="TOTAL READINGS" value="543K+" subtitle="YTD dataset" accent="blue"></ce-kpi-card>
    </div>
    <mat-card style="padding:14px">
      <div class="filter-row">
        <mat-form-field appearance="outline" style="flex:1;min-width:220px">
          <input matInput placeholder="Filter by asset ID..." [(ngModel)]="q">
        </mat-form-field>
        <button class="filter-chip" [class.active]="!alertOnly()" (click)="alertOnly.set(false)">ALL</button>
        <button class="filter-chip" [class.active]="alertOnly()" (click)="alertOnly.set(true)">ALERTS ONLY</button>
      </div>
      <div style="overflow-x:auto">
        <table mat-table [dataSource]="paged()">
          <ng-container matColumnDef="asset_id"><th mat-header-cell *matHeaderCellDef>ASSET ID</th><td mat-cell *matCellDef="let r"><span class="mono amber">{{ r.asset_id }}</span></td></ng-container>
          <ng-container matColumnDef="description"><th mat-header-cell *matHeaderCellDef>DESCRIPTION</th><td mat-cell *matCellDef="let r">{{ assetDesc(r.asset_id) }}</td></ng-container>
          <ng-container matColumnDef="class"><th mat-header-cell *matHeaderCellDef>CLASS</th><td mat-cell *matCellDef="let r"><span *ngIf="assetClass(r.asset_id) as cls" class="tag" [ngClass]="cls">{{ cls }}</span></td></ng-container>
          <ng-container matColumnDef="ts"><th mat-header-cell *matHeaderCellDef>TIMESTAMP</th><td mat-cell *matCellDef="let r"><span class="mono muted">{{ r.ts }}</span></td></ng-container>
          <ng-container matColumnDef="temp"><th mat-header-cell *matHeaderCellDef>TEMP °C</th><td mat-cell *matCellDef="let r"><span class="mono" [style.color]="r.temperature_c>75?'var(--red)':r.temperature_c>65?'var(--amber)':'var(--t2)'">{{ r.temperature_c }}</span></td></ng-container>
          <ng-container matColumnDef="vib"><th mat-header-cell *matHeaderCellDef>VIB mm/s</th><td mat-cell *matCellDef="let r"><span class="mono" [style.color]="(r.vibration_mm_s||0)>3?'var(--red)':(r.vibration_mm_s||0)>2?'var(--amber)':'var(--t2)'">{{ r.vibration_mm_s ?? '—' }}</span></td></ng-container>
          <ng-container matColumnDef="press"><th mat-header-cell *matHeaderCellDef>PRESS bar</th><td mat-cell *matCellDef="let r"><span class="mono muted">{{ r.pressure_bar ?? '—' }}</span></td></ng-container>
          <ng-container matColumnDef="co2"><th mat-header-cell *matHeaderCellDef>CO₂ ppm</th><td mat-cell *matCellDef="let r"><span class="mono" [style.color]="(r.co2_ppm||0)>500?'var(--red)':(r.co2_ppm||0)>420?'var(--amber)':'var(--t2)'">{{ r.co2_ppm ?? '—' }}</span></td></ng-container>
          <ng-container matColumnDef="alert"><th mat-header-cell *matHeaderCellDef>ALERT</th><td mat-cell *matCellDef="let r"><span class="badge" [ngClass]="r.alert?'crit':'ok'">{{ r.alert ? 'ALERT' : 'OK' }}</span></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="cols;sticky:true"></tr>
          <tr mat-row *matRowDef="let r;columns:cols" [style.background]="r.alert?'rgba(231,76,60,.04)':''"></tr>
        </table>
      </div>
    </mat-card>
  `,
  styles: [`:host{display:flex;flex-direction:column;gap:14px;animation:fadeUp .25s ease}@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.filter-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px}.mono{font-family:'IBM Plex Mono',monospace;font-size:9px;&.amber{color:var(--amber)}&.muted{color:var(--t3)}}`]
})
export class SensorComponent {
  private dataS = inject(DataService);
  private exp   = inject(ExportService);
  readonly cols = ['asset_id','description','class','ts','temp','vib','press','co2','alert'];
  readonly Math = Math;
  q = ''; alertOnly = signal(false);

  private aMap = computed(() => { const m: Record<string,any> = {}; this.dataS.assets.forEach(a=>m[a.asset_id]=a); return m; });
  assetDesc(id: string)  { return this.aMap()[id]?.description ?? '—'; }
  assetClass(id: string) { return this.aMap()[id]?.class ?? null; }
  alerts()   { return this.dataS.sensorReadings.filter(r=>r.alert).length.toString(); }
  maxTemp()  { return Math.max(...this.dataS.sensorReadings.map(r=>r.temperature_c)).toFixed(1); }

  readonly filtered = computed(() => this.dataS.sensorReadings.filter(r =>
    (!this.alertOnly() || r.alert) && (!this.q || r.asset_id.toLowerCase().includes(this.q.toLowerCase()))
  ).slice(0, 200));
  readonly paged = this.filtered;

  async onExportXlsx() {
    await this.exp.exportXlsx(this.filtered() as any,[
      {key:'asset_id',label:'Asset ID',width:16},{key:'ts',label:'Timestamp',width:20},
      {key:'temperature_c',label:'Temp °C',width:10},{key:'vibration_mm_s',label:'Vib mm/s',width:12},
      {key:'pressure_bar',label:'Press bar',width:12},{key:'co2_ppm',label:'CO₂ ppm',width:12},
      {key:'alert',label:'Alert',width:8}
    ],'Cordant_SensorFeed','Sensor Feed');
  }
  async onExportPdf() {
    await this.exp.exportPdf(this.filtered() as any,[
      {key:'asset_id',label:'Asset',width:16},{key:'ts',label:'Timestamp',width:20},
      {key:'temperature_c',label:'Temp',width:10},{key:'vibration_mm_s',label:'Vib',width:10},
      {key:'pressure_bar',label:'Press',width:10},{key:'alert',label:'Alert',width:8}
    ],'Cordant_SensorFeed','Sensor Feed','IoT sensor readings');
  }
}
