import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface Integration {
  name: string; category: string; status: 'Connected'|'Partial'|'Planned';
  icon: string; desc: string; lastSync: string; records: string; color: string;
}

@Component({
  selector: 'ce-integrations',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, PageHeaderComponent],
  template: `
    <ce-page-header title="Integrations" subtitle="DATA SOURCES · APIs · ENTERPRISE CONNECTIONS" highlight="12 CONNECTORS"></ce-page-header>

    <!-- Status summary -->
    <div class="status-row">
      <div class="stat-pill ok"><span class="dot"></span>{{ connected }} CONNECTED</div>
      <div class="stat-pill warn"><span class="dot"></span>{{ partial }} PARTIAL</div>
      <div class="stat-pill neutral"><span class="dot"></span>{{ planned }} PLANNED</div>
    </div>

    <!-- Data lineage SVG -->
    <mat-card style="padding:14px">
      <div class="ct" style="margin-bottom:12px">DATA LINEAGE — SOURCE TO INSIGHT</div>
      <div style="overflow-x:auto" [innerHTML]="lineageSvgSafe"></div>
    </mat-card>

    <!-- Integration cards grid -->
    <div class="card-grid">
      <mat-card class="int-card" *ngFor="let i of integrations" [style.border-top-color]="i.color">
        <div class="int-top">
          <div class="int-icon" [style.background]="i.color+'22'" [style.border-color]="i.color+'44'">
            <span>{{ i.icon }}</span>
          </div>
          <div class="int-info">
            <div class="int-name">{{ i.name }}</div>
            <div class="int-cat">{{ i.category }}</div>
          </div>
          <span class="badge" [ngClass]="statusCls(i.status)">{{ i.status }}</span>
        </div>
        <div class="int-desc">{{ i.desc }}</div>
        <div class="int-meta">
          <span class="mono muted">{{ i.lastSync }}</span>
          <span class="mono" [style.color]="i.color">{{ i.records }}</span>
        </div>
        <div class="int-actions">
          <button mat-stroked-button class="int-btn" [disabled]="i.status==='Planned'">Configure</button>
          <button mat-stroked-button class="int-btn" [disabled]="i.status!=='Connected'">Sync Now</button>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`:host{display:flex;flex-direction:column;gap:14px;animation:fadeUp .25s ease}
    @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .status-row{display:flex;gap:8px;flex-wrap:wrap}
    .stat-pill{display:flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;
      font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:500;border:1px solid;
      &.ok{color:var(--green);border-color:var(--greenD);background:rgba(46,204,113,.08)}
      &.warn{color:var(--amber);border-color:var(--amberD);background:var(--amberG)}
      &.neutral{color:var(--t3);border-color:var(--bright);background:var(--el)}}
    .stat-pill .dot{width:6px;height:6px;border-radius:50%;background:currentColor}
    .ct{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:1.2px;text-transform:uppercase;color:var(--t3)}
    .card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
    .int-card{padding:14px!important;border-top:2px solid var(--border)!important;transition:all .15s;&:hover{transform:translateY(-1px)}}
    .int-top{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px}
    .int-icon{width:38px;height:38px;border-radius:6px;border:1px solid;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
    .int-info{flex:1}
    .int-name{font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;color:var(--t1)}
    .int-cat{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--t3);margin-top:1px}
    .int-desc{font-size:10.5px;color:var(--t2);line-height:1.5;margin-bottom:10px}
    .int-meta{display:flex;justify-content:space-between;margin-bottom:10px;padding:6px 8px;background:var(--el);border-radius:3px}
    .mono{font-family:'IBM Plex Mono',monospace;font-size:8.5px;&.muted{color:var(--t3)}}
    .int-actions{display:flex;gap:6px}
    .int-btn{font-family:'IBM Plex Mono',monospace!important;font-size:8.5px!important;
      height:28px!important;border-color:var(--bright)!important;color:var(--t2)!important;
      &:not(:disabled):hover{border-color:var(--amber)!important;color:var(--amber)!important}}
  `]
})
export class IntegrationsComponent {
  private san = inject(DomSanitizer);
  readonly integrations: Integration[] = [
    {name:'SAP PM',category:'CMMS / ERP',status:'Connected',icon:'⚙',
     desc:'Bidirectional sync of work orders, asset master data, and maintenance costs. Functional locations mapped 1:1.',
     lastSync:'5 min ago',records:'500 assets · 5,775 WOs',color:'var(--blue)'},
    {name:'LCA IoT Gateway',category:'IoT / SCADA',status:'Connected',icon:'📡',
     desc:'Real-time sensor feeds: temperature, vibration, pressure, CO₂ and current. 15-minute cadence.',
     lastSync:'< 1 min ago',records:'65 assets · 540K readings',color:'var(--green)'},
    {name:'SCADA / DCS',category:'Process Control',status:'Partial',icon:'🏭',
     desc:'PLC data from 4 control rooms. PL03 Reactor currently offline — awaiting OT network approval.',
     lastSync:'12 min ago',records:'3 of 4 plants',color:'var(--amber)'},
    {name:'Smart Electricity Meters',category:'Energy Metering',status:'Connected',icon:'⚡',
     desc:'Substation-level electricity metering. 15-minute interval data, half-hourly settlement.',
     lastSync:'15 min ago',records:'18 meters · 4 substations',color:'var(--amber)'},
    {name:'Gas Flow Meters',category:'Energy Metering',status:'Connected',icon:'🔥',
     desc:'Process gas consumption via ultrasonic flow meters. Calorific value corrected.',
     lastSync:'30 min ago',records:'12 flow meters',color:'var(--purple)'},
    {name:'Water Flow Meters',category:'Water Management',status:'Connected',icon:'💧',
     desc:'Inlet, outlet and recycle stream metering. Compliant with GRI 303 water disclosure.',
     lastSync:'1 hr ago',records:'9 meters · 4 streams',color:'var(--cyan)'},
    {name:'Grid Supplier API',category:'Tariff / Market',status:'Connected',icon:'🔌',
     desc:'Half-hourly electricity tariffs, demand response signals, and export pricing from grid operator.',
     lastSync:'1 hr ago',records:'Real-time tariffs',color:'var(--blue)'},
    {name:'Gas Supplier Portal',category:'Tariff / Market',status:'Partial',icon:'📊',
     desc:'Monthly gas invoices imported. Live spot price feed pending contract negotiation.',
     lastSync:'Yesterday',records:'Monthly invoices',color:'var(--purple)'},
    {name:'Weather API',category:'External Data',status:'Connected',icon:'🌤',
     desc:'Ambient temperature, wind speed and humidity for energy normalisation and anomaly correction.',
     lastSync:'1 hr ago',records:'Hourly forecast · 4 sites',color:'var(--cyan)'},
    {name:'ESG Platform',category:'Sustainability',status:'Planned',icon:'🌱',
     desc:'CDP, GRI and TCFD reporting automation. Planned for Q2 2025 as part of ESG governance programme.',
     lastSync:'Not connected',records:'Planned Q2 2025',color:'var(--green)'},
    {name:'Power BI',category:'Analytics / BI',status:'Connected',icon:'📈',
     desc:'Embedded dashboards and scheduled dataset refreshes. 8 dashboard pages with custom Cordant theme.',
     lastSync:'Daily 06:00',records:'8 dashboards · CSV export',color:'var(--amber)'},
    {name:'CMMS Mobile',category:'Field Operations',status:'Planned',icon:'📱',
     desc:'Mobile work order execution for field technicians. Offline-capable PWA with barcode scanning.',
     lastSync:'Not connected',records:'Planned Q3 2025',color:'var(--blue)'},
  ];

  get connected() { return this.integrations.filter(i=>i.status==='Connected').length; }
  get partial()   { return this.integrations.filter(i=>i.status==='Partial').length; }
  get planned()   { return this.integrations.filter(i=>i.status==='Planned').length; }

  statusCls(s: string) {
    return {Connected:'ok',Partial:'warn',Planned:'neutral'}[s] ?? 'neutral';
  }

  get lineageSvgSafe() { return this.san.bypassSecurityTrustHtml(this.lineageSvg); }
  readonly lineageSvg = `<svg viewBox="0 0 800 120" width="100%" style="display:block;max-width:100%;font-family:'IBM Plex Mono',monospace">
    <!-- Source layer -->
    <rect x="10"  y="30" width="90" height="26" rx="3" fill="rgba(52,152,219,.15)" stroke="#3498db" stroke-width=".8"/>
    <text x="55"  y="47" text-anchor="middle" font-size="8" fill="#3498db">SAP PM</text>
    <rect x="10"  y="64" width="90" height="26" rx="3" fill="rgba(46,204,113,.15)" stroke="#2ecc71" stroke-width=".8"/>
    <text x="55"  y="81" text-anchor="middle" font-size="8" fill="#2ecc71">IoT / SCADA</text>
    <rect x="10"  y="98" width="90" height="18" rx="3" fill="rgba(26,188,156,.12)" stroke="#1abc9c" stroke-width=".8"/>
    <text x="55"  y="111" text-anchor="middle" font-size="7.5" fill="#1abc9c">Energy Meters</text>
    <!-- Arrow -->
    <line x1="104" y1="60" x2="170" y2="60" stroke="var(--border)" stroke-width=".8" stroke-dasharray="3 2"/>
    <polygon points="170,56 178,60 170,64" fill="var(--border)"/>
    <!-- Processing layer -->
    <rect x="178" y="20" width="110" height="80" rx="4" fill="rgba(245,166,35,.08)" stroke="#f5a623" stroke-width="1"/>
    <text x="233" y="38" text-anchor="middle" font-size="8" fill="#f5a623" font-weight="500">DATA LAYER</text>
    <text x="233" y="52" text-anchor="middle" font-size="7" fill="var(--t3)">Normalisation</text>
    <text x="233" y="64" text-anchor="middle" font-size="7" fill="var(--t3)">Validation</text>
    <text x="233" y="76" text-anchor="middle" font-size="7" fill="var(--t3)">Aggregation</text>
    <text x="233" y="88" text-anchor="middle" font-size="7" fill="var(--t3)">FLOC Mapping</text>
    <!-- Arrow -->
    <line x1="292" y1="60" x2="358" y2="60" stroke="var(--border)" stroke-width=".8" stroke-dasharray="3 2"/>
    <polygon points="358,56 366,60 358,64" fill="var(--border)"/>
    <!-- Analytics layer -->
    <rect x="366" y="20" width="110" height="80" rx="4" fill="rgba(155,89,182,.08)" stroke="#9b59b6" stroke-width="1"/>
    <text x="421" y="38" text-anchor="middle" font-size="8" fill="#9b59b6" font-weight="500">ANALYTICS</text>
    <text x="421" y="52" text-anchor="middle" font-size="7" fill="var(--t3)">RCM Engine</text>
    <text x="421" y="64" text-anchor="middle" font-size="7" fill="var(--t3)">EMS KPIs</text>
    <text x="421" y="76" text-anchor="middle" font-size="7" fill="var(--t3)">Forecasting</text>
    <text x="421" y="88" text-anchor="middle" font-size="7" fill="var(--t3)">Anomaly Detect</text>
    <!-- Arrow -->
    <line x1="480" y1="60" x2="546" y2="60" stroke="var(--border)" stroke-width=".8" stroke-dasharray="3 2"/>
    <polygon points="546,56 554,60 546,64" fill="var(--border)"/>
    <!-- Output layer -->
    <rect x="554" y="20" width="100" height="26" rx="3" fill="rgba(245,166,35,.12)" stroke="#f5a623" stroke-width=".8"/>
    <text x="604" y="37" text-anchor="middle" font-size="8" fill="#f5a623">Cordant Platform</text>
    <rect x="554" y="54" width="100" height="22" rx="3" fill="rgba(52,152,219,.12)" stroke="#3498db" stroke-width=".8"/>
    <text x="604" y="69" text-anchor="middle" font-size="8" fill="#3498db">Power BI</text>
    <rect x="554" y="84" width="100" height="22" rx="3" fill="rgba(46,204,113,.12)" stroke="#2ecc71" stroke-width=".8"/>
    <text x="604" y="99" text-anchor="middle" font-size="7.5" fill="#2ecc71">ESG Reporting</text>
    <!-- Labels -->
    <text x="55"  y="15" text-anchor="middle" font-size="7.5" fill="var(--t3)">DATA SOURCES</text>
    <text x="233" y="12" text-anchor="middle" font-size="7.5" fill="var(--t3)">PROCESSING</text>
    <text x="421" y="12" text-anchor="middle" font-size="7.5" fill="var(--t3)">ANALYTICS</text>
    <text x="604" y="12" text-anchor="middle" font-size="7.5" fill="var(--t3)">OUTPUTS</text>
  </svg>`;
}
