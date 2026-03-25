import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { DataService } from '../../core/services/data.service';
import { ExportService } from '../../core/services/export.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';

function mkRng2(seed:number){let s=seed;return()=>{s=(s*9301+49297)%233280;return s/233280;};}
const rWA=mkRng2(88);

@Component({
  selector: 'ce-ems-water',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatTableModule, PageHeaderComponent, KpiCardComponent],
  template: `
    <ce-page-header title="Water Management" subtitle="CONSUMPTION · RECYCLED · WITHDRAWN · INFLOW · OUTFLOW" highlight="PU · MO · BR"
      (exportXlsx)="onExportXlsx()" (exportPdf)="onExportPdf()"></ce-page-header>
    <div class="grid-auto">
      <ce-kpi-card title="TOTAL WITHDRAWN" value="142,400" unit="m³" delta="▲ 3.2% vs baseline" [deltaGood]="false" subtitle="From source YTD 2024" accent="blue"></ce-kpi-card>
      <ce-kpi-card title="WATER RECYCLED" value="38,600" unit="m³" delta="▲ 11.4% vs last year" [deltaGood]="true" subtitle="Recycling rate: 27.1%" accent="cyan"></ce-kpi-card>
      <ce-kpi-card title="PROCESSED" value="119,800" unit="m³" delta="84.1% of withdrawn" [deltaGood]="true" subtitle="Meets ISO 14001 target" accent="green"></ce-kpi-card>
      <ce-kpi-card title="WATER COST" value="$356K" unit="/yr" delta="▼ 4.1% vs prior year" [deltaGood]="true" subtitle="$2.50/m³ blended rate" accent="amber"></ce-kpi-card>
      <ce-kpi-card title="INFLOW RATE" value="428" unit="m³/day" subtitle="avg daily intake" accent="neutral"></ce-kpi-card>
      <ce-kpi-card title="OUTFLOW" value="312" unit="m³/day" delta="Permit compliant" [deltaGood]="true" subtitle="Treated before discharge" accent="neutral"></ce-kpi-card>
      <ce-kpi-card title="WATER INTENSITY" value="0.84" unit="m³/BOE" delta="▼ 8.6% YoY · Top quartile" [deltaGood]="true" subtitle="vs industry avg 1.12" accent="blue"></ce-kpi-card>
      <ce-kpi-card title="EXCEEDANCES" value="2" delta="Both resolved & reported" [deltaGood]="false" subtitle="Permit limit breaches YTD" accent="red"></ce-kpi-card>
    </div>
    <div class="grid-2">
      <mat-card style="padding:14px">
        <div class="ch"><span class="ct">WATER BALANCE — YTD 2024</span></div>
        <div class="balance-bars">
          <div class="bbal" *ngFor="let b of balance">
            <div class="bbal-hdr"><span style="font-size:10px">{{ b.label }}</span><span class="mono" [style.color]="b.color">{{ b.val.toLocaleString() }} m³</span></div>
            <div style="height:6px;background:var(--border);border-radius:2px;overflow:hidden"><div [style.width.%]="b.pct" [style.background]="b.color" style="height:100%;border-radius:2px;transition:width .6s"></div></div>
          </div>
        </div>
      </mat-card>
      <mat-card style="padding:14px">
        <div class="ch"><span class="ct">MONTHLY CONSUMPTION (m³)</span></div>
        <div class="monthly-bars">
          <div class="mbar-col" *ngFor="let v of waterMonthly; let i=index">
            <div class="mbar-lbl">{{ Math.round(v/1000) }}k</div>
            <div class="mbar-fill" [style.height.px]="barH(v)" [style.background]="v===maxM?'var(--red)':'var(--blue)'"></div>
            <div class="mbar-lbl">{{ mlabels[i] }}</div>
          </div>
        </div>
      </mat-card>
    </div>
    <mat-card style="padding:14px">
      <div class="ch"><span class="ct">WATER BY ASSET — PUMPS · MOTORS · BREAKERS</span></div>
      <div style="overflow-x:auto">
        <table mat-table [dataSource]="assetRows()">
          <ng-container matColumnDef="asset_id"><th mat-header-cell *matHeaderCellDef>ASSET ID</th><td mat-cell *matCellDef="let r"><span class="mono amber">{{ r.asset_id }}</span></td></ng-container>
          <ng-container matColumnDef="description"><th mat-header-cell *matHeaderCellDef>DESCRIPTION</th><td mat-cell *matCellDef="let r">{{ r.desc }}</td></ng-container>
          <ng-container matColumnDef="class"><th mat-header-cell *matHeaderCellDef>CLS</th><td mat-cell *matCellDef="let r"><span class="tag" [ngClass]="r.cls">{{ r.cls }}</span></td></ng-container>
          <ng-container matColumnDef="annual"><th mat-header-cell *matHeaderCellDef>WATER m³/yr</th><td mat-cell *matCellDef="let r"><span class="mono">{{ r.annual.toLocaleString() }}</span></td></ng-container>
          <ng-container matColumnDef="cost"><th mat-header-cell *matHeaderCellDef>COST $</th><td mat-cell *matCellDef="let r"><span class="mono green">{{ '$'+r.cost.toLocaleString() }}</span></td></ng-container>
          <ng-container matColumnDef="energy"><th mat-header-cell *matHeaderCellDef>ENERGY kWh</th><td mat-cell *matCellDef="let r"><span class="mono">{{ r.energy.toLocaleString() }}</span></td></ng-container>
          <ng-container matColumnDef="eff"><th mat-header-cell *matHeaderCellDef>kWh/m³</th><td mat-cell *matCellDef="let r"><span class="mono" [style.color]="r.eff>4?'var(--red)':r.eff>3?'var(--amber)':'var(--green)'">{{ r.eff }}</span></td></ng-container>
          <ng-container matColumnDef="recycled"><th mat-header-cell *matHeaderCellDef>RECYCLED %</th><td mat-cell *matCellDef="let r"><div style="display:flex;align-items:center;gap:4px"><div style="height:4px;background:var(--border);border-radius:2px;width:36px;overflow:hidden"><div style="height:100%;background:var(--cyan)" [style.width.%]="r.recycled"></div></div><span class="mono" style="color:var(--cyan)">{{ r.recycled }}%</span></div></td></ng-container>
          <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>STATUS</th><td mat-cell *matCellDef="let r"><span class="badge" [ngClass]="r.status==='Active'?'ok':r.status==='Standby'?'info':'neutral'">{{ r.status }}</span></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="wCols;sticky:true"></tr>
          <tr mat-row *matRowDef="let r;columns:wCols"></tr>
        </table>
      </div>
    </mat-card>
    <mat-card style="padding:14px">
      <div class="ch"><span class="ct">REGULATORY & ESG WATER METRICS</span></div>
      <div class="grid-4">
        <div class="esg-cell" *ngFor="let e of esgKpis" [style.border-left-color]="e.color">
          <div class="esg-label">{{ e.label }}</div>
          <div class="esg-value" [style.color]="e.color">{{ e.val }}</div>
          <div class="esg-sub">{{ e.sub }}</div>
        </div>
      </div>
    </mat-card>
  `,
  styles: [`:host{display:flex;flex-direction:column;gap:14px;animation:fadeUp .25s ease}@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.ch{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.ct{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:1.2px;text-transform:uppercase;color:var(--t3)}.mono{font-family:'IBM Plex Mono',monospace;font-size:9px;&.amber{color:var(--amber)}&.muted{color:var(--t3)}&.green{color:var(--green)}}.balance-bars{display:flex;flex-direction:column;gap:9px}.bbal-hdr{display:flex;justify-content:space-between;margin-bottom:3px;font-family:'IBM Plex Mono',monospace;font-size:9px}.monthly-bars{display:flex;align-items:flex-end;gap:4px;height:100px}.mbar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px}.mbar-lbl{font-family:'IBM Plex Mono',monospace;font-size:6.5px;color:var(--t3)}.mbar-fill{width:100%;border-radius:1px 1px 0 0;opacity:.75;transition:height .5s}.esg-cell{padding:9px;background:var(--el);border-radius:3px;border-left:2px solid var(--border)}.esg-label{font-family:'IBM Plex Mono',monospace;font-size:7.5px;color:var(--t3);margin-bottom:3px}.esg-value{font-family:'Rajdhani',sans-serif;font-size:17px;font-weight:700}.esg-sub{font-size:9px;color:var(--t3);margin-top:2px}`]
})
export class EmsWaterComponent {
  private dataS = inject(DataService); private exp = inject(ExportService);
  readonly Math = Math;
  readonly mlabels = ['J','F','M','A','M','J','J','A','S','O','N','D'];
  readonly wCols = ['asset_id','description','class','annual','cost','energy','eff','recycled','status'];
  readonly waterMonthly = [11200,10800,11600,12100,12800,13400,14200,14600,12900,11800,11400,10600];
  readonly maxM = Math.max(...this.waterMonthly);
  barH(v:number){ return Math.max(3,Math.round(v/this.maxM*80)); }
  readonly balance = [
    {label:'Total Withdrawn',  val:142400,pct:100,color:'var(--blue)'},
    {label:'Processed/Treated',val:119800,pct:84, color:'var(--green)'},
    {label:'Recycled/Reused',  val:38600, pct:27, color:'var(--cyan)'},
    {label:'Discharged',       val:85200, pct:60, color:'var(--red)'},
    {label:'Losses/Evaporation',val:18800,pct:13, color:'var(--amber)'},
  ];
  readonly assetRows = computed(()=>{
    const rWA2=mkRng2(88);
    return this.dataS.assets.filter(a=>['PU','MO','BR'].includes(a.class)).slice(0,40).map(a=>{
      const base=a.class==='PU'?850:a.class==='MO'?356:624;
      const annual=Math.round((base+rWA2()*300-150)*(0.8+a.criticality*.08));
      const energy=Math.round(annual*(a.class==='PU'?2.7:a.class==='MO'?7.3:2.1));
      const cost=Math.round(annual*2.5); const recycled=Math.round(15+rWA2()*25);
      return {asset_id:a.asset_id,desc:a.description.substring(0,24),cls:a.class,annual,cost,energy,eff:Math.round(energy/annual*100)/100,recycled,status:a.status};
    }).sort((a,b)=>b.annual-a.annual);
  });
  readonly esgKpis = [
    {label:'GRI 303 Compliance',val:'Compliant',sub:'Water withdrawal reported',color:'var(--green)'},
    {label:'Water Recycling Rate',val:'27.1%',sub:'Target: 30% by 2026',color:'var(--cyan)'},
    {label:'Discharge Quality',val:'Grade A',sub:'Meets effluent standards',color:'var(--green)'},
    {label:'Water Stress Risk',val:'Medium',sub:'CDP Water Disclosure ready',color:'var(--amber)'},
    {label:'Net Water Consumed',val:'38,400 m³',sub:'Withdrawn minus returned',color:'var(--blue)'},
    {label:'kWh per m³ Pumped',val:'2.7',sub:'Pump efficiency index',color:'var(--amber)'},
    {label:'Cooling Water Loss',val:'8.4%',sub:'Evaporation + drift',color:'var(--amber)'},
    {label:'Permit Utilisation',val:'68%',sub:'Of annual discharge limit',color:'var(--green)'},
  ];
  async onExportXlsx(){await this.exp.exportXlsx(this.assetRows() as any,[{key:'asset_id',label:'Asset ID',width:16},{key:'desc',label:'Description',width:28},{key:'cls',label:'Class',width:10},{key:'annual',label:'Water m³/yr',width:14},{key:'cost',label:'Cost $',width:12},{key:'energy',label:'Energy kWh',width:14},{key:'eff',label:'kWh/m³',width:10},{key:'recycled',label:'Recycled %',width:12}],'Cordant_Water','Water Management');}
  async onExportPdf(){await this.exp.exportPdf(this.assetRows() as any,[{key:'asset_id',label:'Asset',width:18},{key:'desc',label:'Description',width:28},{key:'cls',label:'Cls',width:8},{key:'annual',label:'Water m³',width:14},{key:'cost',label:'Cost $',width:12},{key:'eff',label:'kWh/m³',width:10}],'Cordant_Water','Water Management','GRI 303 · ISO 14001');}
}
