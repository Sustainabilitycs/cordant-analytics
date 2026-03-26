import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Component, inject, computed, signal, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { DataService } from '../../core/services/data.service';
import { FilterService } from '../../core/services/filter.service';
import { ExportService } from '../../core/services/export.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { MONTHS, MONTH_LABELS, FLOC_DESCRIPTIONS } from '../../core/models/cordant.models';

@Component({
  selector: 'ce-ems-consumption',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatTableModule, PageHeaderComponent, KpiCardComponent],
  template: `
    <ce-page-header title="Energy Consumption"
      subtitle="6 ENERGY TYPES · 500 ASSETS · FLOC ROLLUP"
      highlight="YTD 2024"
      (exportXlsx)="onExportXlsx()" (exportPdf)="onExportPdf()">
      <button mat-stroked-button class="help-btn" (click)="showHelp=!showHelp">? Help</button>
    </ce-page-header>

    <!-- Help panel -->
    <div class="help-banner" *ngIf="showHelp">
      <strong>Amber line = Electricity</strong> on the left axis (absolute kWh). All other types are on the
      <strong>right axis as an index</strong> (Jan = 100) so seasonal patterns are visible across very different volumes.
      Red triangles mark anomaly spike months. Hover FLOC codes in the table below for full descriptions.
      <button mat-icon-button (click)="showHelp=false" style="float:right;margin-top:-4px">✕</button>
    </div>

    <div class="grid-auto">
      <ce-kpi-card title="TOTAL ENERGY COST" value="$2.84" unit="M YTD" delta="▼ 8.4% vs prior year" [deltaGood]="true" subtitle="All energy types combined" accent="amber"></ce-kpi-card>
      <ce-kpi-card title="ELECTRICITY" value="4.82" unit="GWh" delta="▲ 2.1% vs baseline" [deltaGood]="false" subtitle="Primary energy source" accent="neutral"></ce-kpi-card>
      <ce-kpi-card title="PEAK DEMAND" value="847" unit="kW" delta="▲ 12% above avg" [deltaGood]="false" subtitle="Recorded 14 Aug 2024" accent="neutral"></ce-kpi-card>
      <ce-kpi-card title="ANOMALIES YTD" [value]="anomalies()" subtitle="Energy usage outliers" accent="green"></ce-kpi-card>
    </div>

    <!-- Line chart -->
    <mat-card style="padding:14px">
      <div class="card-hdr">
        <span class="ct">ENERGY CONSUMPTION BY TYPE — 2024</span>
        <span class="hint">Amber = Electricity (left kWh) · Others indexed Jan=100 (right)</span>
      </div>
      <div #chartWrap style="width:100%;overflow:hidden;max-width:100%" [innerHTML]="chartSvg()"></div>
    </mat-card>

    <!-- Ranked bars + cost bars -->
    <div class="grid-2">
      <mat-card style="padding:14px">
        <div class="card-hdr">
          <span class="ct">CONSUMPTION BY ENERGY TYPE — YTD</span>
          <span class="hint">Ranked by volume</span>
        </div>
        <div class="ranked-bars">
          <div class="rbar" *ngFor="let s of rankedSeries()">
            <div class="rbar-hdr">
              <span [style.color]="s.color" [style.font-weight]="s.key==='elec'?'600':'400'">{{ s.label }}</span>
              <span class="mono" [style.color]="s.color">{{ s.valStr }}</span>
            </div>
            <div class="rbar-bg">
              <div class="rbar-fill" [style.width.%]="s.pct" [style.background]="s.color" [style.height.px]="s.key==='elec'?8:5" [style.opacity]="s.key==='elec'?1:.7"></div>
            </div>
          </div>
        </div>
      </mat-card>
      <mat-card style="padding:14px">
        <div class="card-hdr">
          <span class="ct">MONTHLY TOTAL COST — $</span>
          <span class="hint">Jan–Dec 2024</span>
        </div>
        <div class="cost-bars">
          <div class="cost-col" *ngFor="let m of costMonthly(); let i=index" [title]="MONTH_LABELS[i]+': $'+Math.round(m.cost/1000)+'k'">
            <div class="cost-lbl">{{ '$' + Math.round(m.cost/1000) }}k</div>
            <div class="cost-fill" [style.height.px]="barH(m.cost, maxCost())"></div>
          </div>
        </div>
        <div class="month-labels">
          <span *ngFor="let l of ['J','F','M','A','M','J','J','A','S','O','N','D']">{{ l }}</span>
        </div>
      </mat-card>
    </div>

    <!-- FLOC table -->
    <mat-card style="padding:14px">
      <div class="card-hdr">
        <span class="ct">CONSUMPTION BY FLOC AREA</span>
        <span class="hint">Annual rollup · sorted by total cost</span>
      </div>
      <div style="overflow-x:auto">
        <table mat-table [dataSource]="flocRows()">
          <ng-container matColumnDef="floc">
            <th mat-header-cell *matHeaderCellDef>FLOC</th>
            <td mat-cell *matCellDef="let r">
              <span class="mono amber">{{ r.floc }}</span>
              <div class="floc-desc">{{ flocDesc(r.floc) }}</div>
            </td>
          </ng-container>
          <ng-container matColumnDef="electricity_kwh"><th mat-header-cell *matHeaderCellDef>ELEC kWh</th><td mat-cell *matCellDef="let r"><span class="mono">{{ r.electricity_kwh.toLocaleString() }}</span></td></ng-container>
          <ng-container matColumnDef="gas_kwh"><th mat-header-cell *matHeaderCellDef>GAS kWh</th><td mat-cell *matCellDef="let r"><span class="mono muted">{{ r.gas_kwh.toLocaleString() }}</span></td></ng-container>
          <ng-container matColumnDef="heating_kwh"><th mat-header-cell *matHeaderCellDef>HEAT kWh</th><td mat-cell *matCellDef="let r"><span class="mono muted">{{ r.heating_kwh.toLocaleString() }}</span></td></ng-container>
          <ng-container matColumnDef="water_m3"><th mat-header-cell *matHeaderCellDef>WATER m³</th><td mat-cell *matCellDef="let r"><span class="mono muted">{{ r.water_m3.toLocaleString() }}</span></td></ng-container>
          <ng-container matColumnDef="coolant_l"><th mat-header-cell *matHeaderCellDef>COOL L</th><td mat-cell *matCellDef="let r"><span class="mono muted">{{ r.coolant_l.toLocaleString() }}</span></td></ng-container>
          <ng-container matColumnDef="motor_fuel_l"><th mat-header-cell *matHeaderCellDef>FUEL L</th><td mat-cell *matCellDef="let r"><span class="mono muted">{{ r.motor_fuel_l.toLocaleString() }}</span></td></ng-container>
          <ng-container matColumnDef="total_cost_usd">
            <th mat-header-cell *matHeaderCellDef>TOTAL COST $</th>
            <td mat-cell *matCellDef="let r">
              <div style="display:flex;align-items:center;gap:8px">
                <span class="mono amber">{{ '$' +  r.total_cost_usd.toLocaleString() }}</span>
                <div style="height:3px;background:var(--border);border-radius:1px;width:60px;overflow:hidden">
                  <div style="height:100%;background:var(--amber)" [style.width.%]="r.total_cost_usd/maxFlocCost()*100"></div>
                </div>
              </div>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="flocCols;sticky:true"></tr>
          <tr mat-row *matRowDef="let r;columns:flocCols"></tr>
        </table>
      </div>
    </mat-card>
  `,
  styles: [`:host{display:flex;flex-direction:column;gap:14px;animation:fadeUp .25s ease}@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.help-banner{padding:10px 14px;background:var(--amberG);border:1px solid var(--amberD);border-radius:3px;font-size:10.5px;color:var(--t2);line-height:1.6}.help-btn{font-family:'IBM Plex Mono',monospace!important;font-size:9px!important;border-color:var(--bright)!important;color:var(--t2)!important;height:32px!important}.card-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.ct{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:1.2px;text-transform:uppercase;color:var(--t3)}.hint{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--t3)}.mono{font-family:'IBM Plex Mono',monospace;font-size:9px;&.amber{color:var(--amber)}&.muted{color:var(--t3)}}.floc-desc{font-size:8px;color:var(--t3);margin-top:1px}.ranked-bars{display:flex;flex-direction:column;gap:10px}.rbar-hdr{display:flex;justify-content:space-between;margin-bottom:3px;font-size:10.5px}.rbar-bg{background:var(--border);border-radius:1px;overflow:hidden}.rbar-fill{border-radius:1px;transition:width .6s}.cost-bars{display:flex;align-items:flex-end;gap:4px;height:80px;margin-bottom:4px}.cost-col{flex:1;display:flex;flex-direction:column;align-items:center;cursor:default}.cost-lbl{font-family:'IBM Plex Mono',monospace;font-size:6.5px;color:var(--t3);margin-bottom:2px}.cost-fill{width:100%;background:var(--amber);opacity:.65;border-radius:1px 1px 0 0}.month-labels{display:flex;gap:4px}.month-labels span{flex:1;text-align:center;font-family:'IBM Plex Mono',monospace;font-size:7px;color:var(--t3)}`]
})
export class EmsConsumptionComponent {
  private dataS = inject(DataService);
  private san = inject(DomSanitizer);
  private exp   = inject(ExportService);
  readonly Math         = Math;
  readonly MONTH_LABELS = MONTH_LABELS;
  readonly flocCols     = ['floc','electricity_kwh','gas_kwh','heating_kwh','water_m3','coolant_l','motor_fuel_l','total_cost_usd'];
  showHelp = false;

  private readonly em = computed(() => this.dataS.energyMonthly);

  readonly anomalies = computed(() => this.em().reduce((s,r)=>s+r.anomaly_count,0).toLocaleString());

  readonly monthlyAgg = computed(() => {
    const map: Record<string, {elec:number,gas:number,heat:number,water:number,cool:number,fuel:number,cost:number,anom:number}> = {};
    for (const r of this.em()) {
      if (!map[r.month]) map[r.month]={elec:0,gas:0,heat:0,water:0,cool:0,fuel:0,cost:0,anom:0};
      const m = map[r.month];
      m.elec+=r.electricity_kwh; m.gas+=r.gas_kwh; m.heat+=r.heating_kwh;
      m.water+=r.water_m3*10; m.cool+=r.coolant_l*.5; m.fuel+=r.motor_fuel_l*2;
      m.cost+=r.total_cost_usd; m.anom+=r.anomaly_count;
    }
    return MONTHS.map(mo=>({month:mo,...(map[mo]??{elec:0,gas:0,heat:0,water:0,cool:0,fuel:0,cost:0,anom:0})}));
  });

  readonly costMonthly = this.monthlyAgg;
  readonly maxCost = computed(()=>Math.max(...this.costMonthly().map(m=>m.cost),1));
  barH(v:number,max:number){ return Math.max(3,Math.round(v/max*64)); }

  readonly rankedSeries = computed(() => {
    const t={elec:0,gas:0,heat:0,water:0,cool:0,fuel:0};
    for (const r of this.em()){t.elec+=r.electricity_kwh;t.gas+=r.gas_kwh;t.heat+=r.heating_kwh;t.water+=r.water_m3*10;t.cool+=r.coolant_l*.5;t.fuel+=r.motor_fuel_l*2;}
    const LABELS={elec:'Electricity',gas:'Gas',heat:'Heating',water:'Water (×10)',cool:'Coolants (×0.5)',fuel:'Motor Fuel (×2)'};
    const COLS={elec:'#C47E10',gas:'#9b59b6',heat:'#e74c3c',water:'#1abc9c',cool:'#888780',fuel:'#3498db'};
    const sorted=Object.entries(t).sort((a,b)=>b[1]-a[1]);
    const max=sorted[0][1];
    return sorted.map(([k,v])=>({
      key:k, label:(LABELS as any)[k], color:(COLS as any)[k],
      pct:Math.round(v/max*100),
      valStr:v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?Math.round(v/1e3)+'k':v.toFixed(0)
    }));
  });

  readonly chartSvg = computed(()=>{
    const monthly = this.monthlyAgg();
    const W=800,H=290,P={t:36,r:118,b:42,l:70};
    const CW=W-P.l-P.r,CH=H-P.t-P.b,N=12,step=CW/(N-1);
    const eVals=monthly.map(m=>m.elec);
    const maxE=Math.max(...eVals)*1.1||1;
    const magE=Math.pow(10,Math.floor(Math.log10(maxE)));
    const niceE=Math.ceil(maxE/magE)*magE;
    const rSeries=[
      {key:'fuel',label:'Motor Fuel',color:'#5a7fa0',w:1.8,dash:''},
      {key:'water',label:'Water',color:'#1abc9c',w:1.8,dash:''},
      {key:'heat',label:'Heating',color:'#e74c3c',w:1.5,dash:'4 3'},
      {key:'gas',label:'Gas',color:'#9b59b6',w:1.5,dash:'4 3'},
      {key:'cool',label:'Coolants',color:'#888780',w:1.2,dash:'2 4'},
    ];
    let nMax=115,nMin=85;
    for(const s of rSeries){const b=(monthly[0] as any)[s.key]||1;for(const m of monthly){const v=(m as any)[s.key]/b*100;if(v>nMax)nMax=v+3;if(v<nMin)nMin=v-3;}}
    const xP=(i:number)=>P.l+i*step;
    const yL=(v:number)=>P.t+CH*(1-v/niceE);
    const yR=(v:number)=>P.t+CH*(1-(v-nMin)/(nMax-nMin));
    let h=`<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;max-width:100%;font-family:\'IBM Plex Mono\',monospace">`;
    for(let i=0;i<=4;i++){const v=niceE*i/4,y=yL(v);const lbl=v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?Math.round(v/1e3)+'k':v.toFixed(0);h+=`<line x1="${P.l}" y1="${y.toFixed(1)}" x2="${P.l+CW}" y2="${y.toFixed(1)}" stroke="var(--border)" stroke-width="${i===0?.8:.4}"/>`;h+=`<text x="${P.l-4}" y="${y.toFixed(1)}" text-anchor="end" dominant-baseline="central" font-size="9" fill="var(--t3)">${lbl}</text>`;}
    for(let i=0;i<=4;i++){const v=nMin+(nMax-nMin)*i/4,y=yR(v);h+=`<text x="${P.l+CW+4}" y="${y.toFixed(1)}" dominant-baseline="central" font-size="8" fill="var(--t3)" opacity=".7">${Math.round(v)}</text>`;}
    for(let i=0;i<N;i++) h+=`<text x="${xP(i).toFixed(1)}" y="${P.t+CH+14}" text-anchor="middle" font-size="9" fill="var(--t3)">${MONTH_LABELS[i]}</text>`;
    const ePts=monthly.map((m,i)=>({x:xP(i),y:yL(m.elec)}));
    h+=`<path d="M${ePts.map(p=>p.x.toFixed(1)+','+p.y.toFixed(1)).join(' L')} L${xP(N-1).toFixed(1)},${P.t+CH} L${xP(0).toFixed(1)},${P.t+CH} Z" fill="#C47E10" opacity=".07"/>`;
    const rLabels:{y:number,text:string,color:string}[]=[];
    for(const s of rSeries){const b=(monthly[0] as any)[s.key]||1;const pts=monthly.map((m,i)=>({x:xP(i),y:yR((m as any)[s.key]/b*100)}));h+=`<path d="M${pts.map(p=>p.x.toFixed(1)+','+p.y.toFixed(1)).join(' L')}" fill="none" stroke="${s.color}" stroke-width="${s.w}" stroke-dasharray="${s.dash}" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>`;const last=pts[N-1],lv=(monthly[N-1] as any)[s.key];const lbl=lv>=1e3?Math.round(lv/1e3)+'k':lv.toFixed(1);rLabels.push({y:last.y,text:`${s.label} ${lbl}`,color:s.color});}
    rLabels.sort((a,b)=>a.y-b.y);
    for(let i=1;i<rLabels.length;i++) if(rLabels[i].y-rLabels[i-1].y<12) rLabels[i].y=rLabels[i-1].y+12;
    for(const lb of rLabels) h+=`<text x="${(xP(N-1)+7).toFixed(1)}" y="${lb.y.toFixed(1)}" dominant-baseline="central" font-size="8" fill="${lb.color}">${lb.text}</text>`;
    h+=`<path d="M${ePts.map(p=>p.x.toFixed(1)+','+p.y.toFixed(1)).join(' L')}" fill="none" stroke="#C47E10" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    ePts.forEach(p=>{h+=`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="#C47E10" stroke="var(--card)" stroke-width="1.5"/>`;});
    const eL=ePts[N-1],eLv=monthly[N-1].elec;h+=`<text x="${(eL.x+7).toFixed(1)}" y="${eL.y.toFixed(1)}" dominant-baseline="central" font-size="10" font-weight="600" fill="#C47E10">Electricity ${Math.round(eLv/1000)}k</text>`;
    for(let i=0;i<N;i++) if((monthly[i].anom||0)>100) h+=`<path d="M${xP(i)} ${P.t-11} L${(xP(i)-5).toFixed(1)} ${P.t-3} L${(xP(i)+5).toFixed(1)} ${P.t-3} Z" fill="var(--red)" opacity=".75"/>`;
    h+='</svg>';
    return this.san.bypassSecurityTrustHtml(h);
  });

  readonly flocRows = computed(()=>{
    const map: Record<string,any> = {};
    for(const r of this.em()){
      if(!map[r.floc]) map[r.floc]={floc:r.floc,electricity_kwh:0,gas_kwh:0,heating_kwh:0,water_m3:0,coolant_l:0,motor_fuel_l:0,total_cost_usd:0};
      const f=map[r.floc];f.electricity_kwh+=r.electricity_kwh;f.gas_kwh+=r.gas_kwh;f.heating_kwh+=r.heating_kwh;f.water_m3+=r.water_m3;f.coolant_l+=r.coolant_l;f.motor_fuel_l+=r.motor_fuel_l;f.total_cost_usd+=r.total_cost_usd;
    }
    return Object.values(map).map(r=>({...r,electricity_kwh:Math.round(r.electricity_kwh),gas_kwh:Math.round(r.gas_kwh),heating_kwh:Math.round(r.heating_kwh),water_m3:Math.round(r.water_m3*10)/10,coolant_l:Math.round(r.coolant_l*10)/10,motor_fuel_l:Math.round(r.motor_fuel_l),total_cost_usd:Math.round(r.total_cost_usd)})).sort((a:any,b:any)=>b.total_cost_usd-a.total_cost_usd);
  });
  readonly maxFlocCost = computed(()=>Math.max(...this.flocRows().map((r:any)=>r.total_cost_usd),1));
  flocDesc(floc: string){ return FLOC_DESCRIPTIONS[floc]??''; }

  async onExportXlsx(){
    await this.exp.exportXlsx(this.flocRows() as any,[
      {key:'floc',label:'FLOC',width:24},{key:'electricity_kwh',label:'Electricity kWh',width:18},
      {key:'gas_kwh',label:'Gas kWh',width:14},{key:'heating_kwh',label:'Heating kWh',width:14},
      {key:'water_m3',label:'Water m³',width:12},{key:'coolant_l',label:'Coolant L',width:12},
      {key:'motor_fuel_l',label:'Fuel L',width:12},{key:'total_cost_usd',label:'Total Cost $',width:16}
    ],'Cordant_EMS_Consumption','EMS Consumption');
  }
  async onExportPdf(){
    await this.exp.exportPdf(this.flocRows() as any,[
      {key:'floc',label:'FLOC',width:26},{key:'electricity_kwh',label:'Elec kWh',width:16},
      {key:'gas_kwh',label:'Gas kWh',width:14},{key:'total_cost_usd',label:'Cost $',width:16}
    ],'Cordant_EMS_Consumption','Energy Consumption','YTD 2024 · All energy types');
  }
}
