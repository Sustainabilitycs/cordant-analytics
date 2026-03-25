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
import { CLASS_COLORS, CLASS_NAMES, MONTHS, MONTH_LABELS, EquipmentClass } from '../../core/models/cordant.models';

const CC = CLASS_COLORS as Record<string, string>;
const CN = CLASS_NAMES  as Record<string, string>;
const ALL_CLASSES: EquipmentClass[] = ['PU','MO','TR','SW','BR','VA'];

@Component({
  selector: 'ce-ems-overview',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatTableModule, PageHeaderComponent, KpiCardComponent],
  template: `
    <ce-page-header title="EMS Overview" subtitle="ASSET CLASS ANALYSIS · HEATMAP · ANOMALIES" highlight="MOTORS · PUMPS · ALL CLASSES"
      (exportXlsx)="onExportXlsx()" (exportPdf)="onExportPdf()"></ce-page-header>
    <div class="filter-row">
      <div style="display:flex;gap:4px">
        <button class="filter-chip" *ngFor="let p of ['YTD','Q4','Q3','Q2']" [class.active]="period()===p" (click)="period.set(p)">{{ p }}</button>
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">
        <button class="filter-chip" [class.active]="cls()==='ALL'" (click)="cls.set('ALL')">All Classes</button>
        <button class="filter-chip" *ngFor="let c of classKeys" [class.active]="cls()===c" (click)="cls.set(c)"
          [style.border-color]="cls()===c ? clsColor(c) : ''" [style.color]="cls()===c ? clsColor(c) : ''">
          <span class="tag" [ngClass]="c">{{ c }}</span> {{ clsName(c) }}
        </button>
      </div>
    </div>
    <div class="grid-auto">
      <ce-kpi-card title="TOTAL CONSUMPTION" [value]="kpi().totalKwh" unit="kWh" [delta]="kpi().deltaKwh" [deltaGood]="false" subtitle="All energy types" accent="amber"></ce-kpi-card>
      <ce-kpi-card title="TOTAL COST" [value]="kpi().totalCost" [delta]="kpi().deltaCost" [deltaGood]="false" subtitle="USD all classes" accent="neutral"></ce-kpi-card>
      <ce-kpi-card title="AVG PER ASSET" [value]="kpi().avgKwh" unit="kWh" [subtitle]="kpi().assetCount+' assets filtered'" accent="neutral"></ce-kpi-card>
      <ce-kpi-card title="ANOMALIES" [value]="kpi().anomalies" [delta]="kpi().deltaAnom" [deltaGood]="false" subtitle="Threshold + spike events" accent="red"></ce-kpi-card>
      <ce-kpi-card title="PEAK ASSET" [value]="kpi().peakVal" unit="kWh" [subtitle]="kpi().peakId" accent="neutral"></ce-kpi-card>
      <ce-kpi-card title="EFFICIENCY" [value]="kpi().eff" [delta]="kpi().effLabel" [deltaGood]="parseFloat(kpi().eff)<1" subtitle="Normalised score vs baseline" accent="green"></ce-kpi-card>
    </div>
    <mat-card style="padding:14px;overflow:hidden">
      <div class="ch"><span class="ct">ENERGY CONSUMPTION PER CLASS — TIME SERIES</span><span class="hint">Jan–Dec 2024 · kWh equivalent</span></div>
      <div style="width:100%;overflow:hidden" [innerHTML]="timeSeriesSvg()"></div>
    </mat-card>
    <div class="four-col">
      <mat-card style="padding:14px">
        <div class="ch"><span class="ct">TOTAL BY CLASS</span></div>
        <div style="display:flex;flex-direction:column;align-items:center">
          <div [innerHTML]="pieSvg()"></div>
          <div class="pie-legend">
            <div class="pie-row" *ngFor="let s of pieSlices()">
              <div class="pie-dot" [style.background]="clsColor(s.cls)"></div>
              <span>{{ clsName(s.cls) }}</span>
              <span class="mono" [style.color]="clsColor(s.cls)">{{ s.pct }}%</span>
            </div>
          </div>
        </div>
      </mat-card>
      <mat-card style="padding:14px">
        <div class="ch"><span class="ct">BY PLANT</span></div>
        <div class="h-bars">
          <div class="h-bar" *ngFor="let p of byPlant()">
            <div class="h-bar-hdr"><span style="font-size:9px">{{ p.label }}</span><span class="mono amber">{{ p.valStr }}</span></div>
            <div style="height:16px;background:var(--border);border-radius:2px;overflow:hidden"><div [style.width.%]="p.pct" style="height:100%;background:var(--amber);opacity:.8;border-radius:2px;transition:width .5s"></div></div>
          </div>
        </div>
      </mat-card>
      <mat-card style="padding:14px">
        <div class="ch"><span class="ct">BY EQUIPMENT TYPE</span></div>
        <div class="h-bars">
          <div class="h-bar" *ngFor="let s of bySubclass()">
            <div class="h-bar-hdr"><span style="font-size:9px;color:var(--t2)">{{ s.label }}</span><span class="mono" style="color:var(--blue)">{{ s.valStr }}</span></div>
            <div style="height:12px;background:var(--border);border-radius:2px;overflow:hidden"><div [style.width.%]="s.pct" style="height:100%;background:var(--blue);opacity:.75;border-radius:2px;transition:width .5s"></div></div>
          </div>
        </div>
      </mat-card>
      <mat-card style="padding:14px">
        <div class="ch"><span class="ct">BY ENERGY TYPE</span></div>
        <div class="h-bars">
          <div class="h-bar" *ngFor="let e of byEtype()">
            <div class="h-bar-hdr"><span style="font-size:9px">{{ e.label }}</span><span class="mono" [style.color]="e.color">{{ e.valStr }}</span></div>
            <div style="height:14px;background:var(--border);border-radius:2px;overflow:hidden"><div [style.width.%]="e.pct" [style.background]="e.color" style="height:100%;opacity:.8;border-radius:2px;transition:width .5s"></div></div>
          </div>
        </div>
      </mat-card>
    </div>
    <mat-card style="padding:14px">
      <div class="ch"><span class="ct">CONSUMPTION HEATMAP — CLASS × MONTH</span><span class="hint">Darker = higher consumption</span></div>
      <div style="overflow-x:auto" [innerHTML]="heatmapHtml()"></div>
    </mat-card>
    <div class="grid-2">
      <mat-card style="padding:14px">
        <div class="ch"><span class="ct">CONSUMPTION DISTRIBUTION BY ASSET</span><span class="hint">kWh/yr frequency</span></div>
        <div class="histogram">
          <div class="hist-col" *ngFor="let b of histogram(); let i=index" [title]="binLabels[i]+': '+b+' assets'">
            <div class="hist-val">{{ b }}</div>
            <div class="hist-fill" [style.height.px]="barHist(b)"></div>
          </div>
        </div>
        <div class="hist-labels"><span *ngFor="let l of binLabels">{{ l }}</span></div>
      </mat-card>
      <mat-card style="padding:14px">
        <div class="ch"><span class="ct">ANOMALY SEVERITY BY CLASS</span></div>
        <div class="anom-bars">
          <div class="anom-row" *ngFor="let a of anomByCls()">
            <div class="anom-hdr">
              <span class="tag" [ngClass]="a.cls">{{ a.cls }}</span>
              <span style="font-size:9.5px;color:var(--t2)">{{ clsName(a.cls) }}</span>
              <span class="mono" style="margin-left:auto">{{ a.total }} events</span>
            </div>
            <div class="anom-stack">
              <div [style.flex]="a.spike||1" style="background:var(--red);opacity:.8"></div>
              <div [style.flex]="a.drift||1" style="background:var(--amber);opacity:.8"></div>
              <div [style.flex]="a.threshold||1" style="background:var(--blue);opacity:.8"></div>
            </div>
            <div class="anom-legend">
              <span style="color:var(--red)">■ Spike {{ a.spike }}</span>
              <span style="color:var(--amber)">■ Drift {{ a.drift }}</span>
              <span style="color:var(--blue)">■ Threshold {{ a.threshold }}</span>
            </div>
          </div>
        </div>
      </mat-card>
    </div>
    <mat-card style="padding:14px">
      <div class="ch"><span class="ct">ALERT MONITORING REPORT</span><span class="badge crit">{{ alertRows().length }} ACTIVE</span></div>
      <div style="overflow-x:auto">
        <table mat-table [dataSource]="alertRows()">
          <ng-container matColumnDef="asset"><th mat-header-cell *matHeaderCellDef>ASSET ID</th><td mat-cell *matCellDef="let r"><span class="mono amber">{{ r.asset_id }}</span></td></ng-container>
          <ng-container matColumnDef="desc"><th mat-header-cell *matHeaderCellDef>DESCRIPTION</th><td mat-cell *matCellDef="let r">{{ r.desc }}</td></ng-container>
          <ng-container matColumnDef="cls"><th mat-header-cell *matHeaderCellDef>CLS</th><td mat-cell *matCellDef="let r"><span class="tag" [ngClass]="r.cls">{{ r.cls }}</span></td></ng-container>
          <ng-container matColumnDef="type"><th mat-header-cell *matHeaderCellDef>ALERT TYPE</th><td mat-cell *matCellDef="let r"><span class="badge warn">{{ r.type }}</span></td></ng-container>
          <ng-container matColumnDef="sev"><th mat-header-cell *matHeaderCellDef>SEVERITY</th><td mat-cell *matCellDef="let r"><span class="badge" [ngClass]="r.sev==='HIGH'?'crit':r.sev==='MEDIUM'?'warn':'info'">{{ r.sev }}</span></td></ng-container>
          <ng-container matColumnDef="threshold"><th mat-header-cell *matHeaderCellDef>THRESHOLD</th><td mat-cell *matCellDef="let r"><span class="mono">{{ r.threshold.toLocaleString() }}</span></td></ng-container>
          <ng-container matColumnDef="current"><th mat-header-cell *matHeaderCellDef>CURRENT</th><td mat-cell *matCellDef="let r"><span class="mono" [style.color]="r.dev>30?'var(--red)':'var(--t2)'">{{ r.current.toLocaleString() }}</span></td></ng-container>
          <ng-container matColumnDef="dev"><th mat-header-cell *matHeaderCellDef>DEV %</th><td mat-cell *matCellDef="let r"><span class="mono" [style.color]="r.dev>20?'var(--red)':r.dev>0?'var(--amber)':'var(--green)'">+{{ r.dev }}%</span></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="alertCols;sticky:true"></tr>
          <tr mat-row *matRowDef="let r;columns:alertCols"></tr>
        </table>
      </div>
    </mat-card>
  `,
  styles: [`:host{display:flex;flex-direction:column;gap:14px;animation:fadeUp .25s ease}
    @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .filter-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
    .ch{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
    .ct{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:1.2px;text-transform:uppercase;color:var(--t3)}
    .hint{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--t3)}
    .mono{font-family:'IBM Plex Mono',monospace;font-size:9px}
    .mono.amber{color:var(--amber)}
    .four-col{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
    @media(max-width:1200px){.four-col{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:700px){.four-col{grid-template-columns:1fr}}
    .pie-legend{display:flex;flex-direction:column;gap:3px;width:100%;margin-top:6px}
    .pie-row{display:flex;align-items:center;gap:4px;font-size:9px;color:var(--t2)}
    .pie-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
    .h-bars{display:flex;flex-direction:column;gap:8px}
    .h-bar-hdr{display:flex;justify-content:space-between;margin-bottom:2px}
    .histogram{display:flex;align-items:flex-end;gap:5px;height:90px;margin-bottom:5px}
    .hist-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:1px}
    .hist-val{font-family:'IBM Plex Mono',monospace;font-size:7px;color:var(--t3)}
    .hist-fill{width:100%;background:var(--amber);border-radius:2px 2px 0 0;opacity:.72}
    .hist-labels{display:flex;gap:5px}
    .hist-labels span{flex:1;text-align:center;font-family:'IBM Plex Mono',monospace;font-size:6.5px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .anom-bars{display:flex;flex-direction:column;gap:10px}
    .anom-hdr{display:flex;align-items:center;gap:6px;margin-bottom:4px}
    .anom-stack{display:flex;height:10px;border-radius:2px;overflow:hidden;gap:1px;min-height:10px}
    .anom-legend{display:flex;gap:8px;margin-top:3px;font-family:'IBM Plex Mono',monospace;font-size:7.5px;color:var(--t3)}`]
})
export class EmsOverviewComponent {

  private dataS = inject(DataService);
  private exp   = inject(ExportService);
  private san   = inject(DomSanitizer);

  readonly classKeys    = ALL_CLASSES;
  readonly MONTH_LABELS = MONTH_LABELS;
  readonly alertCols    = ['asset','desc','cls','type','sev','threshold','current','dev'];
  readonly binLabels    = ['0-500','500-1k','1k-2k','2k-5k','5k-10k','10k-20k','20k-50k','50k+'];
  readonly Math         = Math;

  clsColor(c: string): string { return CC[c] ?? '#888'; }
  clsName(c: string): string  { return CN[c] ?? c; }
  parseFloat(v: string): number { return parseFloat(v); }

  period = signal('YTD');
  cls    = signal<string>('ALL');

  private readonly PERIOD_MONTHS: Record<string, string[]> = {
    YTD: MONTHS, Q4: MONTHS.slice(9,12), Q3: MONTHS.slice(6,9), Q2: MONTHS.slice(3,6)
  };

  private readonly rows = computed(() => {
    const months = this.PERIOD_MONTHS[this.period()] ?? MONTHS;
    const c = this.cls();
    return this.dataS.energyMonthly.filter(r =>
      months.includes(r.month) && (c === 'ALL' || r.class === c)
    );
  });

  readonly kpi = computed(() => {
    const r = this.rows();
    const c = this.cls();
    const prevPMap: Record<string,string> = { YTD:'YTD', Q4:'Q3', Q3:'Q2', Q2:'YTD' };
    const prevM = this.PERIOD_MONTHS[prevPMap[this.period()] ?? 'YTD'] ?? MONTHS;
    const prev  = this.dataS.energyMonthly.filter(x =>
      prevM.includes(x.month) && (c === 'ALL' || x.class === c)
    );

    let totKwh=0, totCost=0, totAnom=0, prevKwh=0, prevCost=0, prevAnom=0;
    const aSet = new Set<string>();
    const aMap: Record<string,number> = {};

    for (const x of r) {
      const v = x.electricity_kwh + x.gas_kwh + x.heating_kwh + x.water_m3*10 + x.coolant_l*.5 + x.motor_fuel_l*2;
      totKwh += v; totCost += x.total_cost_usd;
      totAnom += x.anomaly_count + x.spike_count;
      aSet.add(x.asset_id);
      aMap[x.asset_id] = (aMap[x.asset_id] ?? 0) + v;
    }
    for (const x of prev) {
      prevKwh  += x.electricity_kwh + x.gas_kwh + x.heating_kwh + x.water_m3*10 + x.coolant_l*.5 + x.motor_fuel_l*2;
      prevCost += x.total_cost_usd;
      prevAnom += x.anomaly_count + x.spike_count;
    }

    const nA   = aSet.size || 1;
    const fmt  = (v: number) => v >= 1e6 ? (v/1e6).toFixed(2)+'M' : v >= 1e3 ? Math.round(v/1e3)+'k' : Math.round(v)+'';
    const dpct = (a: number, b: number) => {
      if (!b) return '';
      const p = Math.round((a-b)/b*100);
      return (p > 0 ? '▲' : '▼') + Math.abs(p) + '% vs prev';
    };
    const peak = Object.entries(aMap).sort((a,b) => b[1]-a[1])[0] ?? ['—', 0];
    const eff  = prevKwh > 0 ? Math.round(totKwh/prevKwh*100)/100 : 1.0;

    return {
      totalKwh: fmt(totKwh), totalCost: '$'+fmt(totCost),
      avgKwh: fmt(totKwh/nA), anomalies: totAnom.toString(),
      peakVal: fmt(peak[1] as number), peakId: peak[0] as string,
      eff: eff.toFixed(2),
      deltaKwh:  dpct(totKwh,  prevKwh),
      deltaCost: dpct(totCost, prevCost),
      deltaAnom: dpct(totAnom, prevAnom),
      effLabel:  eff < 1 ? '✓ Below baseline' : 'Above baseline',
      assetCount: nA.toString()
    };
  });

  readonly pieSlices = computed(() => {
    const t: Record<string,number> = {};
    for (const r of this.rows()) {
      t[r.class] = (t[r.class] ?? 0) + r.electricity_kwh + r.gas_kwh + r.heating_kwh + r.water_m3*10 + r.coolant_l*.5 + r.motor_fuel_l*2;
    }
    const tot = Object.values(t).reduce((a,b) => a+b, 0) || 1;
    return Object.entries(t).sort((a,b) => b[1]-a[1]).map(([cls,v]) => ({
      cls: cls as EquipmentClass, pct: Math.round(v/tot*100)
    }));
  });

  readonly pieSvg = computed((): SafeHtml => {
    const slices = this.pieSlices();
    const cx=90, cy=90, R=75, ri=35;
    let ang = -Math.PI/2;
    let h = '<svg viewBox="0 0 180 180" width="160" height="160" style="display:block;overflow:visible">';
    for (const s of slices) {
      const col = CC[s.cls] ?? '#888';
      const a = s.pct/100*2*Math.PI, end = ang+a, la = a > Math.PI ? 1 : 0;
      const x1=cx+R*Math.cos(ang), y1=cy+R*Math.sin(ang);
      const x2=cx+R*Math.cos(end), y2=cy+R*Math.sin(end);
      const xi1=cx+ri*Math.cos(ang), yi1=cy+ri*Math.sin(ang);
      const xi2=cx+ri*Math.cos(end), yi2=cy+ri*Math.sin(end);
      const mid = ang + a/2;
      h += `<path d="M${xi1.toFixed(1)} ${yi1.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)} A${R} ${R} 0 ${la} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} L${xi2.toFixed(1)} ${yi2.toFixed(1)} A${ri} ${ri} 0 ${la} 0 ${xi1.toFixed(1)} ${yi1.toFixed(1)} Z" fill="${col}" opacity=".85" stroke="var(--card)" stroke-width="1.5"/>`;
      if (s.pct >= 6) h += `<text x="${(cx+R*.62*Math.cos(mid)).toFixed(1)}" y="${(cy+R*.62*Math.sin(mid)).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="9" font-weight="600" fill="#fff">${s.pct}%</text>`;
      ang = end;
    }
    h += '</svg>';
    return this.san.bypassSecurityTrustHtml(h);
  });

  readonly byPlant = computed(() => {
    const t: Record<string,number> = { 'CE-PL01':0, 'CE-PL02':0, 'CE-PL03':0, 'CE-PL04':0 };
    const n: Record<string,string> = { 'CE-PL01':'Plant 1 Crude', 'CE-PL02':'Plant 2 Refinery', 'CE-PL03':'Plant 3 Chemical', 'CE-PL04':'Plant 4 Utilities' };
    for (const r of this.rows()) {
      const p = r.floc.substring(0,7);
      if (t[p] !== undefined) t[p] += r.electricity_kwh + r.gas_kwh + r.heating_kwh + r.water_m3*10 + r.coolant_l*.5 + r.motor_fuel_l*2;
    }
    const max = Math.max(...Object.values(t), 1);
    const fmt = (v: number) => v >= 1e6 ? (v/1e6).toFixed(1)+'M' : v >= 1e3 ? Math.round(v/1e3)+'k' : Math.round(v)+'';
    return Object.entries(t).sort((a,b) => b[1]-a[1]).map(([p,v]) => ({ label: n[p] ?? p, pct: Math.round(v/max*100), valStr: fmt(v) }));
  });

  readonly bySubclass = computed(() => {
    const SC: Record<string,string> = {
      PUGN:'Gen.Pump', PUHY:'Hydraulic', PUDI:'Diaphragm', PUSK:'Submersible',
      MOSM:'Motor <15kW', MOME:'Motor 15-75kW', MOLG:'Motor >75kW',
      TRPR:'Press.Trans', TRTE:'Temp.Trans', TRFL:'Flow Trans', TRLE:'Level Trans',
      SWPS:'Press.Sw', SWTS:'Temp.Sw', SWGS:'Gas Det', SWFS:'Flame Det',
      BRMV:'MV Breaker', BRLV:'LV Breaker', BRTR:'Transformer', BRPN:'MCC Panel',
      VACV:'Ctrl Valve', VASV:'Safety Valve', VAON:'On/Off Valve'
    };
    const t: Record<string,number> = {};
    for (const r of this.rows()) {
      t[r.sub_class] = (t[r.sub_class] ?? 0) + r.electricity_kwh + r.gas_kwh + r.heating_kwh + r.water_m3*10 + r.coolant_l*.5 + r.motor_fuel_l*2;
    }
    const sorted = Object.entries(t).sort((a,b) => b[1]-a[1]).slice(0,8);
    const max    = sorted[0]?.[1] ?? 1;
    const fmt    = (v: number) => v >= 1e3 ? Math.round(v/1e3)+'k' : Math.round(v)+'';
    return sorted.map(([sc,v]) => ({ label: SC[sc] ?? sc, pct: Math.round(v/max*100), valStr: fmt(v) }));
  });

  readonly byEtype = computed(() => {
    const t = { elec:0, gas:0, heat:0, water:0, cool:0, fuel:0 };
    for (const r of this.rows()) {
      t.elec += r.electricity_kwh; t.gas += r.gas_kwh; t.heat += r.heating_kwh;
      t.water += r.water_m3*10;   t.cool += r.coolant_l*.5; t.fuel += r.motor_fuel_l*2;
    }
    const COLS: Record<string,string> = { elec:'#C47E10', gas:'#9b59b6', heat:'#e74c3c', water:'#1abc9c', cool:'#888780', fuel:'#3498db' };
    const LBLS: Record<string,string> = { elec:'Electricity', gas:'Gas', heat:'Heating', water:'Water', cool:'Coolants', fuel:'Motor Fuel' };
    const sorted = Object.entries(t).sort((a,b) => b[1]-a[1]);
    const max    = sorted[0]?.[1] ?? 1;
    const fmt    = (v: number) => v >= 1e6 ? (v/1e6).toFixed(1)+'M' : v >= 1e3 ? Math.round(v/1e3)+'k' : Math.round(v)+'';
    return sorted.map(([k,v]) => ({ label: LBLS[k], color: COLS[k], pct: Math.round(v/max*100), valStr: fmt(v) }));
  });

  readonly timeSeriesSvg = computed((): SafeHtml => {
    const activeCls = this.cls();
    const classes: string[] = activeCls === 'ALL' ? [...ALL_CLASSES] : [activeCls];
    const clsM: Record<string, Record<string,number>> = {};
    for (const cls of classes) { clsM[cls] = {}; for (const m of MONTHS) clsM[cls][m] = 0; }
    for (const r of this.dataS.energyMonthly) {
      if (activeCls !== 'ALL' && r.class !== activeCls) continue;
      if (clsM[r.class]) clsM[r.class][r.month] = (clsM[r.class][r.month] ?? 0) + r.electricity_kwh + r.gas_kwh + r.heating_kwh + r.water_m3*10 + r.coolant_l*.5 + r.motor_fuel_l*2;
    }
    const W=820, H=190, P={t:24, r:130, b:34, l:60};
    const CW=W-P.l-P.r, CH=H-P.t-P.b, N=12, step=CW/(N-1);
    let maxV = 0;
    for (const cls of classes) for (const m of MONTHS) { const v = clsM[cls]?.[m] ?? 0; if (v > maxV) maxV = v; }
    maxV = maxV*1.1 || 1;
    const xP = (i: number) => P.l + i*step;
    const yP = (v: number) => P.t + CH*(1 - v/maxV);
    let h = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;font-family:'IBM Plex Mono',monospace;overflow:visible">`;
    for (let i=0; i<=4; i++) {
      const v=maxV*i/4, y=yP(v);
      const lbl = v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?Math.round(v/1e3)+'k':v.toFixed(0);
      h += `<line x1="${P.l}" y1="${y.toFixed(1)}" x2="${P.l+CW}" y2="${y.toFixed(1)}" stroke="var(--border)" stroke-width="${i===0?.8:.3}"/>`;
      h += `<text x="${P.l-4}" y="${y.toFixed(1)}" text-anchor="end" dominant-baseline="central" font-size="8.5" fill="var(--t3)">${lbl}</text>`;
    }
    for (let i=0; i<N; i++) h += `<text x="${xP(i).toFixed(1)}" y="${P.t+CH+12}" text-anchor="middle" font-size="8.5" fill="var(--t3)">${MONTH_LABELS[i]}</text>`;
    const stack = MONTHS.map(() => 0);
    const labelData: { y: number; cls: string }[] = [];
    for (const cls of [...classes].reverse()) {
      const col  = CC[cls] ?? '#888';
      const vals = MONTHS.map(m => clsM[cls]?.[m] ?? 0);
      const topY = vals.map((v,i) => yP(stack[i] + v));
      const botY = stack.map((_,i) => yP(stack[i]));
      const aTop = topY.map((y,i) => `${xP(i).toFixed(1)},${y.toFixed(1)}`).join(' L');
      const aBot = botY.map((y,i) => `${xP(N-1-i).toFixed(1)},${y.toFixed(1)}`).reverse().join(' L');
      h += `<path d="M${aTop} L${aBot} Z" fill="${col}" opacity=".28"/>`;
      h += `<path d="M${topY.map((y,i)=>`${xP(i).toFixed(1)},${y.toFixed(1)}`).join(' L')}" fill="none" stroke="${col}" stroke-width="1.5" stroke-linejoin="round"/>`;
      vals.forEach((v,i) => stack[i] += v);
      labelData.push({ y: topY[N-1], cls });
    }
    labelData.sort((a,b) => a.y - b.y);
    for (let i=1; i<labelData.length; i++) {
      if (labelData[i].y - labelData[i-1].y < 13) labelData[i].y = labelData[i-1].y + 13;
    }
    for (const { y, cls } of labelData) {
      const ly = Math.max(P.t+6, Math.min(P.t+CH-4, y));
      h += `<text x="${(xP(N-1)+7).toFixed(1)}" y="${ly.toFixed(1)}" dominant-baseline="central" font-size="8.5" fill="${CC[cls]??'#888'}" font-weight="500">${CN[cls]??cls}</text>`;
    }
    h += '</svg>';
    return this.san.bypassSecurityTrustHtml(h);
  });

  readonly heatmapHtml = computed((): SafeHtml => {
    const activeCls = this.cls();
    const hmCls: string[] = activeCls === 'ALL' ? [...ALL_CLASSES] : [activeCls];
    const hm: Record<string, Record<string,number>> = {};
    for (const cls of hmCls) { hm[cls] = {}; for (const m of MONTHS) hm[cls][m] = 0; }
    for (const r of this.dataS.energyMonthly) {
      if (activeCls !== 'ALL' && r.class !== activeCls) continue;
      if (hm[r.class]?.[r.month] !== undefined) hm[r.class][r.month] += r.electricity_kwh + r.gas_kwh + r.heating_kwh + r.water_m3*10 + r.coolant_l*.5 + r.motor_fuel_l*2;
    }
    const allV  = Object.values(hm).flatMap(row => Object.values(row));
    const maxHM = Math.max(...allV, 1);
    const fmt   = (v: number) => v >= 1e3 ? Math.round(v/1e3)+'k' : Math.round(v)+'';
    let t = `<table style="border-collapse:collapse;font-family:'IBM Plex Mono',monospace;font-size:8px"><tr><th style="width:80px;padding:3px 6px;color:var(--t3);text-align:left;font-weight:400"></th>`;
    for (const m of MONTHS) t += `<th style="width:52px;padding:3px 2px;color:var(--t3);text-align:center;font-weight:400">${m.substring(5)}</th>`;
    t += `</tr>`;
    for (const cls of hmCls) {
      const col  = CC[cls] ?? '#888';
      const name = CN[cls] ?? cls;
      t += `<tr><td style="padding:3px 6px;color:${col};font-weight:500;white-space:nowrap">${name}</td>`;
      for (const m of MONTHS) {
        const v       = hm[cls]?.[m] ?? 0;
        const opacity = (0.08 + (v/maxHM)*0.82).toFixed(2);
        const txtOp   = v/maxHM > 0.4 ? 1 : 0;
        t += `<td style="padding:2px"><div style="width:48px;height:26px;border-radius:2px;background:${col};opacity:${opacity};display:flex;align-items:center;justify-content:center" title="${name} · ${m} · ${fmt(v)} kWh"><span style="font-size:7.5px;color:var(--card);font-weight:500;opacity:${txtOp}">${fmt(v)}</span></div></td>`;
      }
      t += `</tr>`;
    }
    t += `</table>`;
    return this.san.bypassSecurityTrustHtml(t);
  });

  readonly histogram = computed(() => {
    const aMap: Record<string,number> = {};
    for (const r of this.rows()) aMap[r.asset_id] = (aMap[r.asset_id] ?? 0) + r.electricity_kwh + r.gas_kwh + r.heating_kwh;
    const vals = Object.values(aMap);
    const bins  = [0,500,1000,2000,5000,10000,20000,50000,Infinity];
    return bins.slice(0,-1).map((_,i) => vals.filter(v => v >= bins[i] && v < bins[i+1]).length);
  });

  barHist(c: number): number { return Math.max(3, Math.round(c / Math.max(...this.histogram(), 1) * 72)); }

  readonly anomByCls = computed(() => {
    const activeCls = this.cls();
    const hmCls: string[] = activeCls === 'ALL' ? [...ALL_CLASSES] : [activeCls];
    return hmCls.map(cls => {
      const r         = this.rows().filter(x => x.class === cls);
      const spike     = r.reduce((s,x) => s + x.spike_count,    0);
      const drift     = r.reduce((s,x) => s + x.anomaly_count,  0);
      const threshold = r.filter(x => x.anomaly_count > 2).length;
      return { cls, spike, drift, threshold, total: spike + drift + threshold };
    });
  });

  readonly alertRows = computed(() => {
    const seen = new Set<string>(); const rows: any[] = [];
    for (const r of this.rows()) {
      if (!r.anomaly_count && !r.spike_count) continue;
      if (seen.has(r.asset_id)) continue;
      seen.add(r.asset_id);
      const a = this.dataS.assets.find(x => x.asset_id === r.asset_id);
      if (!a) continue;
      const threshold = Math.round((r.electricity_kwh + r.gas_kwh + r.heating_kwh) * 0.75);
      const current   = Math.round(r.electricity_kwh + r.gas_kwh + r.heating_kwh);
      const dev       = threshold > 0 ? Math.round((current - threshold) / threshold * 100) : 0;
      const sev       = r.spike_count > 0 ? 'HIGH' : dev > 30 ? 'MEDIUM' : 'LOW';
      rows.push({ asset_id: r.asset_id, desc: a.description.substring(0,22), cls: a.class, type: r.spike_count > 0 ? 'Sudden Spike' : 'Threshold Breach', sev, threshold, current, dev });
      if (rows.length >= 12) break;
    }
    return rows;
  });

  async onExportXlsx() {
    await this.exp.exportXlsx(this.alertRows(), [
      {key:'asset_id',label:'Asset ID',width:16},{key:'desc',label:'Description',width:26},
      {key:'cls',label:'Class',width:10},{key:'type',label:'Alert Type',width:18},
      {key:'sev',label:'Severity',width:12},{key:'threshold',label:'Threshold',width:14},
      {key:'current',label:'Current',width:14},{key:'dev',label:'Dev %',width:10}
    ], 'Cordant_EMS_Overview', 'EMS Overview');
  }

  async onExportPdf() {
    await this.exp.exportPdf(this.alertRows(), [
      {key:'asset_id',label:'Asset',width:16},{key:'desc',label:'Description',width:26},
      {key:'cls',label:'Cls',width:8},{key:'type',label:'Alert Type',width:18},
      {key:'sev',label:'Severity',width:12},{key:'dev',label:'Dev %',width:10}
    ], 'Cordant_EMS_Overview', 'EMS Overview', 'Alert monitoring report');
  }
}
