import { Component, inject, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import { DataService } from '../../core/services/data.service';
import { FilterService } from '../../core/services/filter.service';
import { ExportService } from '../../core/services/export.service';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import {
  Asset, WorkOrder, EquipmentClass, WoType,
  CLASS_COLORS, CLASS_NAMES, CRIT_COLORS, WO_COLORS, WO_FULL_NAMES
} from '../../core/models/cordant.models';

const PAGE_SIZE = 12;

@Component({
  selector:   'ce-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatTooltipModule, RouterLink,
    KpiCardComponent, PageHeaderComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls:   ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  private data   = inject(DataService);
  readonly f     = inject(FilterService);
  private export = inject(ExportService);

  readonly Math          = Math;
  readonly CLASS_COLORS  = CLASS_COLORS;
  readonly CLASS_NAMES   = CLASS_NAMES;
  readonly CRIT_COLORS   = CRIT_COLORS;
  readonly WO_COLORS     = WO_COLORS;
  readonly WO_FULL_NAMES = WO_FULL_NAMES;
  readonly WO_TYPES: WoType[] = ['PM','CM','PdM','Inspection','Modification'];
  readonly CRIT_LEVELS    = [5,4,3,2,1];
  readonly CLASS_KEYS     = Object.keys(CLASS_NAMES) as EquipmentClass[];
  readonly CLASS_TOTALS: Record<EquipmentClass, number> = {PU:80,MO:120,TR:160,SW:60,BR:50,VA:30};

  woPage = signal(0);

  // ── FILTERED DATASETS (computed signals) ─────────────────────
  readonly filteredWOs = computed(() => {
    const cls  = this.f.activeClass();
    const crit = this.f.activeCrit();
    const type = this.f.activeType();
    return this.data.workOrders.filter(w => {
      const a = this.assetMap()[w.asset_id];
      if (!a) return false;
      if (cls  && a.class        !== cls)  return false;
      if (crit && a.criticality  !== crit) return false;
      if (type && w.wo_type      !== type) return false;
      return true;
    });
  });

  readonly filteredAssets = computed(() => {
    const cls  = this.f.activeClass();
    const crit = this.f.activeCrit();
    return this.data.assets.filter(a => {
      if (cls  && a.class       !== cls)  return false;
      if (crit && a.criticality !== crit) return false;
      return true;
    });
  });

  readonly assetMap = computed<Record<string, Asset>>(() => {
    const map: Record<string, Asset> = {};
    for (const a of this.data.assets) map[a.asset_id] = a;
    return map;
  });

  // ── KPI COMPUTEDS ─────────────────────────────────────────────
  readonly kpiCmRatio = computed(() => {
    const wos = this.filteredWOs();
    if (!wos.length) return '0';
    return Math.round(wos.filter(w => w.wo_type === 'CM').length / wos.length * 100).toString();
  });

  readonly kpiOverdue = computed(() =>
    this.filteredWOs().filter(w => w.status === 'Planned').length.toString()
  );

  // ── WO TYPE CHART DATA ────────────────────────────────────────
  readonly woTypeCounts = computed(() => {
    const counts: Record<WoType, number> = {PM:0,CM:0,PdM:0,Inspection:0,Modification:0};
    for (const w of this.filteredWOs()) {
      if (counts[w.wo_type] !== undefined) counts[w.wo_type]++;
    }
    return counts;
  });

  readonly maxWoCount = computed(() =>
    Math.max(...Object.values(this.woTypeCounts()), 1)
  );

  // ── CRITICALITY CHART DATA ────────────────────────────────────
  readonly critCounts = computed(() => {
    const counts: Record<number, number> = {1:0,2:0,3:0,4:0,5:0};
    for (const a of this.filteredAssets()) counts[a.criticality]++;
    return counts;
  });

  readonly critAllCounts = computed(() => {
    const counts: Record<number, number> = {1:0,2:0,3:0,4:0,5:0};
    for (const a of this.data.assets) counts[a.criticality]++;
    return counts;
  });

  // ── CLASS COVERAGE DATA ───────────────────────────────────────
  readonly classCounts = computed(() => {
    const counts: Record<string, number> = {PU:0,MO:0,TR:0,SW:0,BR:0,VA:0};
    for (const a of this.filteredAssets()) counts[a.class]++;
    return counts;
  });

  // ── PAGED WO TABLE ─────────────────────────────────────────────
  readonly pagedWOs = computed(() => {
    const sorted = [...this.filteredWOs()]
      .sort((a,b) => b.planned_date.localeCompare(a.planned_date));
    const p = this.woPage();
    return sorted.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE);
  });

  readonly totalWoPages = computed(() =>
    Math.ceil(this.filteredWOs().length / PAGE_SIZE) || 1
  );

  readonly displayedColumns = [
    'wo_number','asset_id','description','class','wo_type',
    'priority','planned_date','status','technician','cost'
  ];

  ngOnInit(): void {
    // Pre-warm data
    void this.data.assets;
    void this.data.workOrders;
  }

  // ── CROSS-FILTER ACTIONS ──────────────────────────────────────
  toggleType(type: WoType): void  { this.f.setType(type);  this.woPage.set(0); }
  toggleCrit(crit: number): void  { this.f.setCrit(crit);  this.woPage.set(0); }
  toggleClass(cls: EquipmentClass): void { this.f.setClass(cls); this.woPage.set(0); }
  reset(): void { this.f.resetAll(); this.woPage.set(0); }

  prevPage(): void { if (this.woPage() > 0) this.woPage.update(p => p - 1); }
  nextPage(): void { if (this.woPage() < this.totalWoPages() - 1) this.woPage.update(p => p + 1); }

  // ── BAR HEIGHT CALCULATION ────────────────────────────────────
  barHeight(value: number, max: number, maxPx = 110): number {
    return Math.max(4, Math.round(value / max * maxPx));
  }

  // ── CRIT PIPS ────────────────────────────────────────────────
  critPipRange = [1,2,3,4,5];
  pipColor(level: number, pip: number): string {
    return pip === level ? CRIT_COLORS[level] : 'var(--border)';
  }

  // ── ASSET HELPER ────────────────────────────────────────────
  getAsset(assetId: string): Asset | undefined {
    return this.assetMap()[assetId];
  }

  shortDesc(asset: Asset | undefined): string {
    if (!asset) return '-';
    return asset.description.length > 22
      ? asset.description.substring(0, 22) + '…'
      : asset.description;
  }

  priorityClass(pri: string): string {
    return {Critical:'crit',High:'warn',Medium:'info',Low:'neutral'}[pri] ?? 'neutral';
  }

  statusClass(s: string): string {
    return {Completed:'ok',Closed:'ok','In Progress':'warn',Planned:'info',Cancelled:'neutral'}[s] ?? 'neutral';
  }

  formatCost(cost: number | null): string {
    if (!cost) return '—';
    return '$' + Math.round(cost).toLocaleString();
  }

  // ── EXPORT ────────────────────────────────────────────────────
  async onExportXlsx(): Promise<void> {
    const rows = this.filteredWOs().map(w => {
      const a = this.getAsset(w.asset_id);
      return {
        wo_number: w.wo_number, asset_id: w.asset_id,
        description: a?.description ?? '',
        class: a?.class ?? '', floc: w.floc,
        wo_type: w.wo_type, priority: w.priority,
        planned_date: w.planned_date, status: w.status,
        technician: w.technician_name,
        duration_h: w.duration_h ?? '',
        cost_usd: w.cost_usd ?? ''
      };
    });
    await this.export.exportXlsx(rows as any, [
      {key:'wo_number',   label:'WO Number',   width:14},
      {key:'asset_id',    label:'Asset ID',     width:16},
      {key:'description', label:'Description',  width:30},
      {key:'class',       label:'Class',        width:10},
      {key:'floc',        label:'FLOC',         width:20},
      {key:'wo_type',     label:'WO Type',      width:14},
      {key:'priority',    label:'Priority',     width:12},
      {key:'planned_date',label:'Planned Date', width:14},
      {key:'status',      label:'Status',       width:14},
      {key:'technician',  label:'Technician',   width:20},
      {key:'duration_h',  label:'Duration (h)', width:14},
      {key:'cost_usd',    label:'Cost (USD)',   width:14},
    ], 'Cordant_WO_Dashboard', 'Work Orders');
  }

  async onExportPdf(): Promise<void> {
    const rows = this.filteredWOs().slice(0, 200).map(w => {
      const a = this.getAsset(w.asset_id);
      return {
        wo_number: w.wo_number, asset_id: w.asset_id,
        description: (a?.description ?? '').substring(0, 24),
        class: a?.class ?? '', wo_type: w.wo_type,
        priority: w.priority, status: w.status,
        cost_usd: w.cost_usd ? '$' + Math.round(w.cost_usd) : '—'
      };
    });
    const filters = this.f.filterLabel() || 'All filters';
    await this.export.exportPdf(rows as any, [
      {key:'wo_number',   label:'WO #',        width:18},
      {key:'asset_id',    label:'Asset',        width:18},
      {key:'description', label:'Description',  width:40},
      {key:'class',       label:'Class',        width:10},
      {key:'wo_type',     label:'Type',         width:14},
      {key:'priority',    label:'Priority',     width:14},
      {key:'status',      label:'Status',       width:14},
      {key:'cost_usd',    label:'Cost',         width:14},
    ], 'Cordant_Dashboard', 'Maintenance Dashboard', filters);
  }
}
