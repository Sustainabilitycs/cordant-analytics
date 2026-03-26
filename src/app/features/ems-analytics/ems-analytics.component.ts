import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { DataService } from '../../core/services/data.service';
import { ExportService } from '../../core/services/export.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { CLASS_NAMES, CLASS_COLORS, EquipmentClass } from '../../core/models/cordant.models';

@Component({
  selector: 'ce-ems-analytics',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatTableModule, PageHeaderComponent, KpiCardComponent],
  template: `
    <ce-page-header title="Energy Analytics" subtitle="ASSET ENERGY · BENCHMARKING · SANKEY FLOW" highlight="COMPETITIVE EDGE"
      (exportXlsx)="onExportXlsx()" (exportPdf)="onExportPdf()"></ce-page-header>
    <div class="grid-4">
      <ce-kpi-card title="ENERGY INTENSITY" value="8.4" unit="GJ/BOE" delta="▼ 6.2% YoY · Top quartile" [deltaGood]="true" subtitle="Competitive benchmark" accent="blue"></ce-kpi-card>
      <ce-kpi-card title="TOP CONSUMER" value="Motors" delta="42% of total electricity" [deltaGood]="false" subtitle="Highest consuming class" accent="green"></ce-kpi-card>
      <ce-kpi-card title="PEER RANK" value="#3" unit="/14" delta="▲ 2 positions vs 2023" [deltaGood]="true" subtitle="Energy intensity vs peers" accent="amber"></ce-kpi-card>
      <ce-kpi-card title="RENEWABLE MIX" value="22" unit="%" delta="▲ 4% vs last year" [deltaGood]="true" subtitle="Of total electricity" accent="neutral"></ce-kpi-card>
    </div>
    <!-- Sankey -->
    <mat-card style="padding:14px">
      <div class="ch"><span class="ct">ENERGY FLOW — PLANT → CLASS → ENERGY TYPE</span><span class="hint">Total cost $2.84M YTD</span></div>
      <div style="overflow-x:auto" [innerHTML]="sankeySvg()"></div>
    </mat-card>
    <!-- Asset table -->
    <mat-card style="padding:14px">
      <div class="ch"><span class="ct">ASSET ENERGY DETAIL — TOP 40 CONSUMERS</span></div>
      <div style="overflow-x:auto">
        <table mat-table [dataSource]="assetRows()">
          <ng-container matColumnDef="asset_id"><th mat-header-cell *matHeaderCellDef>ASSET</th><td mat-cell *matCellDef="let r"><span class="mono amber">{{ r.id }}</span></td></ng-container>
          <ng-container matColumnDef="class"><th mat-header-cell *matHeaderCellDef>CLS</th><td mat-cell *matCellDef="let r"><span class="tag" [ngClass]="r.cls">{{ r.cls }}</span></td></ng-container>
          <ng-container matColumnDef="floc"><th mat-header-cell *matHeaderCellDef>FLOC</th><td mat-cell *matCellDef="let r"><span class="mono muted">{{ r.floc }}</span></td></ng-container>
          <ng-container matColumnDef="elec"><th mat-header-cell *matHeaderCellDef>ELEC kWh</th><td mat-cell *matCellDef="let r"><span class="mono">{{ r.elec.toLocaleString() }}</span></td></ng-container>
          <ng-container matColumnDef="gas"><th mat-header-cell *matHeaderCellDef>GAS kWh</th><td mat-cell *matCellDef="let r"><span class="mono muted">{{ r.gas||'—' }}</span></td></ng-container>
          <ng-container matColumnDef="cost"><th mat-header-cell *matHeaderCellDef>COST $</th><td mat-cell *matCellDef="let r"><span class="mono amber">{{ '$' + r.cost.toLocaleString() }}</span></td></ng-container>
          <ng-container matColumnDef="anom"><th mat-header-cell *matHeaderCellDef>ANOM</th><td mat-cell *matCellDef="let r"><span class="mono" [style.color]="r.anom>5?'var(--red)':r.anom>2?'var(--amber)':'var(--t3)'">{{ r.anom }}</span></td></ng-container>
          <ng-container matColumnDef="bar"><th mat-header-cell *matHeaderCellDef>INTENSITY</th><td mat-cell *matCellDef="let r"><div style="height:3px;background:var(--border);border-radius:1px;width:60px;overflow:hidden"><div style="height:100%;background:var(--blue)" [style.width.%]="r.cost/maxCost()*100"></div></div></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="aCols;sticky:true"></tr>
          <tr mat-row *matRowDef="let r;columns:aCols"></tr>
        </table>
      </div>
    </mat-card>
  `,
  styles: [`:host{display:flex;flex-direction:column;gap:14px;animation:fadeUp .25s ease}@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.ch{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.ct{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:1.2px;text-transform:uppercase;color:var(--t3)}.hint{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--t3)}.mono{font-family:'IBM Plex Mono',monospace;font-size:9px;&.amber{color:var(--amber)}&.muted{color:var(--t3)}}`]
})
export class EmsAnalyticsComponent {
  private dataS = inject(DataService); private exp = inject(ExportService);
  private san = inject(DomSanitizer);
  readonly CLASS_COLORS = CLASS_COLORS; readonly CLASS_NAMES = CLASS_NAMES;
  readonly Math = Math;
  readonly aCols = ['asset_id','class','floc','elec','gas','cost','anom','bar'];

  readonly assetRows = computed(()=>{
    const map:Record<string,any>={};
    for(const r of this.dataS.energyMonthly){
      if(!map[r.asset_id]) map[r.asset_id]={id:r.asset_id,cls:r.class,floc:r.floc,elec:0,gas:0,cost:0,anom:0};
      const x=map[r.asset_id];x.elec+=r.electricity_kwh;x.gas+=r.gas_kwh;x.cost+=r.total_cost_usd;x.anom+=r.anomaly_count;
    }
    return Object.values(map).map((r:any)=>({...r,elec:Math.round(r.elec),gas:Math.round(r.gas)||0,cost:Math.round(r.cost)})).sort((a:any,b:any)=>b.cost-a.cost).slice(0,40);
  });
  readonly maxCost = computed(()=>Math.max(...this.assetRows().map((r:any)=>r.cost),1));

  readonly sankeySvg = computed(()=>{
    const em = this.dataS.energyMonthly;
    const pCost:Record<string,number>={};
    const cCost:Record<string,number>={};
    const eCost={elec:0,gas:0,heat:0,water:0,cool:0,fuel:0};
    for(const r of em){
      const p=r.floc.substring(0,7);pCost[p]=(pCost[p]||0)+r.total_cost_usd;
      cCost[r.class]=(cCost[r.class]||0)+r.total_cost_usd;
      eCost.elec+=r.electricity_kwh*.12;eCost.gas+=r.gas_kwh*.08;eCost.heat+=r.heating_kwh*.07;eCost.water+=r.water_m3*2.5;eCost.cool+=r.coolant_l*8;eCost.fuel+=r.motor_fuel_l*.95;
    }
    const W=820,H=280,NW=110,GAP=8;
    const total=Object.values(pCost).reduce((a,b)=>a+b,0)||1;
    const PNAMES:Record<string,string>={'CE-PL01':'Plant 1','CE-PL02':'Plant 2','CE-PL03':'Plant 3','CE-PL04':'Plant 4'};
    const CNAMES:Record<string,string>={PU:'Pumps',MO:'Motors',TR:'Transmitters',SW:'Switches',BR:'Breakers',VA:'Valves'};
    const ENAMES:Record<string,string>={elec:'Electricity',gas:'Gas',heat:'Heating',water:'Water',cool:'Coolants',fuel:'Motor Fuel'};
    const PCOLS:Record<string,string>={'CE-PL01':'#f5a623','CE-PL02':'#3498db','CE-PL03':'#e74c3c','CE-PL04':'#2ecc71'};
    const CCOLS:Record<string,string>={PU:'#3498db',MO:'#e74c3c',TR:'#2ecc71',SW:'#f5a623',BR:'#9b59b6',VA:'#1abc9c'};
    const ECOLS:Record<string,string>={elec:'#C47E10',gas:'#9b59b6',heat:'#e74c3c',water:'#1abc9c',cool:'#888780',fuel:'#3498db'};
    function layout(items:Record<string,number>,cols:Record<string,string>,x:number){
      let y=20,nodes:any[]=[];
      for(const [k,v] of Object.entries(items).sort((a,b)=>b[1]-a[1])){
        const h=Math.max(18,Math.round(v/total*(H-60)));
        nodes.push({k,v,x,y,h,color:cols[k]||'#888'});y+=h+GAP;
      }
      return nodes;
    }
    const pn=layout(pCost,PCOLS,30);
    const cn=layout(cCost,CCOLS,295);
    const en=layout(eCost,ECOLS,560);
    let h=`<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;max-width:100%;font-family:'IBM Plex Mono',monospace">`;
    for(const p of pn) for(const c of cn){const w=Math.max(1,Math.round(Math.min(p.v,c.v)/total*40));const mx=(p.x+NW+c.x)/2;h+=`<path d="M${p.x+NW} ${p.y+p.h/2} C${mx} ${p.y+p.h/2} ${mx} ${c.y+c.h/2} ${c.x} ${c.y+c.h/2}" fill="none" stroke="${p.color}" stroke-width="${w}" opacity=".14"/>`;}
    for(const c of cn) for(const e of en){const w=Math.max(1,Math.round(Math.min(c.v,e.v)/total*35));const mx=(c.x+NW+e.x)/2;h+=`<path d="M${c.x+NW} ${c.y+c.h/2} C${mx} ${c.y+c.h/2} ${mx} ${e.y+e.h/2} ${e.x} ${e.y+e.h/2}" fill="none" stroke="${c.color}" stroke-width="${w}" opacity=".14"/>`;}
    for(const nodes of [pn,cn,en]) for(const n of nodes){h+=`<rect x="${n.x}" y="${n.y}" width="${NW}" height="${n.h}" rx="3" fill="${n.color}" opacity=".18" stroke="${n.color}" stroke-width=".8"/>`;const nm=PNAMES[n.k]||CNAMES[n.k]||ENAMES[n.k]||n.k;h+=`<text x="${n.x+NW/2}" y="${n.y+n.h/2-(n.h>28?5:0)}" text-anchor="middle" dominant-baseline="central" font-size="8" fill="${n.color}" font-weight="500">${nm}</text>`;if(n.h>28)h+=`<text x="${n.x+NW/2}" y="${n.y+n.h/2+9}" text-anchor="middle" dominant-baseline="central" font-size="7" fill="${n.color}" opacity=".75">$${Math.round(n.v/1000)}K</text>`;}
    for(const [lbl,x] of [['PLANT',30+NW/2],['EQUIPMENT CLASS',295+NW/2],['ENERGY TYPE',560+NW/2]])h+=`<text x="${x}" y="10" text-anchor="middle" font-size="7.5" fill="var(--t3)">${lbl}</text>`;
    h+=`<rect x="${W-130}" y="100" width="120" height="52" rx="4" fill="var(--card)" stroke="var(--amber)" stroke-width=".8"/><text x="${W-70}" y="122" text-anchor="middle" font-family="Rajdhani,sans-serif" font-size="18" font-weight="700" fill="var(--amber)">$2.84M</text><text x="${W-70}" y="140" text-anchor="middle" font-size="7.5" fill="var(--t3)">YTD 2024</text>`;
    h+='</svg>';return this.san.bypassSecurityTrustHtml(h);
  });

  async onExportXlsx(){await this.exp.exportXlsx(this.assetRows() as any,[{key:'id',label:'Asset ID',width:16},{key:'cls',label:'Class',width:10},{key:'floc',label:'FLOC',width:22},{key:'elec',label:'Electricity kWh',width:18},{key:'gas',label:'Gas kWh',width:14},{key:'cost',label:'Cost $',width:14},{key:'anom',label:'Anomalies',width:12}],'Cordant_EMS_Analytics','EMS Analytics');}
  async onExportPdf(){await this.exp.exportPdf(this.assetRows().slice(0,100) as any,[{key:'id',label:'Asset',width:18},{key:'cls',label:'Cls',width:8},{key:'floc',label:'FLOC',width:20},{key:'elec',label:'Elec kWh',width:14},{key:'cost',label:'Cost $',width:14},{key:'anom',label:'Anom',width:10}],'Cordant_EMS_Analytics','Energy Analytics','Top asset consumers');}
}
