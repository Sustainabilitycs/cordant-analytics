import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';

import { DataService } from '../../core/services/data.service';
import { FilterService } from '../../core/services/filter.service';
import { ExportService } from '../../core/services/export.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { CLASS_NAMES, CLASS_COLORS, CRIT_COLORS, EquipmentClass } from '../../core/models/cordant.models';

const PAGE_SIZE = 20;

@Component({
  selector: 'ce-assets',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatTableModule,
    MatTooltipModule, PageHeaderComponent],
  template: `
    <ce-page-header title="Asset Register"
      subtitle="500 ASSETS · 22 SUB-CLASSES · FLOC MAPPED"
      highlight="RCM CLASSIFIED"
      (exportXlsx)="onExportXlsx()" (exportPdf)="onExportPdf()">
    </ce-page-header>

    <!-- Filters -->
    <mat-card class="filter-card">
      <div class="filter-row">
        <mat-form-field appearance="outline" class="search-field">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput placeholder="Search asset ID, description, manufacturer..." [(ngModel)]="searchTerm" (ngModelChange)="onSearch()">
        </mat-form-field>
        <div class="chip-group">
          <span class="chip-label">CLASS:</span>
          <button class="filter-chip" [class.active]="classFilt()==='ALL'" (click)="setClass('ALL')">All</button>
          <button class="filter-chip" *ngFor="let cls of classKeys"
            [class.active]="classFilt()===cls" (click)="setClass(cls)"
            [style.border-color]="classFilt()===cls ? CLASS_COLORS[cls] : ''"
            [style.color]="classFilt()===cls ? CLASS_COLORS[cls] : ''">
            <span class="tag" [ngClass]="cls">{{ cls }}</span> {{ CLASS_NAMES[cls] }}
          </button>
        </div>
        <div class="chip-group">
          <span class="chip-label">CRIT:</span>
          <button class="filter-chip" [class.active]="critFilt()==='ALL'" (click)="setCrit('ALL')">ALL</button>
          <button class="filter-chip" *ngFor="let c of [5,4,3]"
            [class.active]="critFilt()===c.toString()" (click)="setCrit(c.toString())">CRIT {{ c }}</button>
        </div>
      </div>
    </mat-card>

    <!-- Table -->
    <mat-card class="table-card">
      <div class="card-hdr">
        <span class="ct">ASSET REGISTER</span>
        <span class="record-count">{{ filtered().length }} of 500</span>
      </div>
      <div style="overflow-x:auto">
        <table mat-table [dataSource]="paged()">
          <ng-container matColumnDef="asset_id">
            <th mat-header-cell *matHeaderCellDef>ASSET ID</th>
            <td mat-cell *matCellDef="let a"><span class="mono amber">{{ a.asset_id }}</span></td>
          </ng-container>
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>DESCRIPTION</th>
            <td mat-cell *matCellDef="let a">{{ a.description }}</td>
          </ng-container>
          <ng-container matColumnDef="class">
            <th mat-header-cell *matHeaderCellDef>CLASS</th>
            <td mat-cell *matCellDef="let a"><span class="tag" [ngClass]="a.class">{{ a.class }}</span></td>
          </ng-container>
          <ng-container matColumnDef="sub_class">
            <th mat-header-cell *matHeaderCellDef>SUB-CLASS</th>
            <td mat-cell *matCellDef="let a"><span class="mono muted">{{ a.sub_class }}</span></td>
          </ng-container>
          <ng-container matColumnDef="floc">
            <th mat-header-cell *matHeaderCellDef>FLOC</th>
            <td mat-cell *matCellDef="let a"><span class="mono muted small">{{ a.floc }}</span></td>
          </ng-container>
          <ng-container matColumnDef="manufacturer">
            <th mat-header-cell *matHeaderCellDef>MANUFACTURER</th>
            <td mat-cell *matCellDef="let a">{{ a.manufacturer }}</td>
          </ng-container>
          <ng-container matColumnDef="criticality">
            <th mat-header-cell *matHeaderCellDef>CRITICALITY</th>
            <td mat-cell *matCellDef="let a">
              <div class="crit-pips">
                <div class="pip" *ngFor="let p of [1,2,3,4,5]"
                  [style.background]="p === a.criticality ? CRIT_COLORS[a.criticality] : 'var(--border)'">
                </div>
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>STATUS</th>
            <td mat-cell *matCellDef="let a">
              <span class="badge" [ngClass]="statusCls(a.status)">{{ a.status }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="operating_hours">
            <th mat-header-cell *matHeaderCellDef>OP. HRS</th>
            <td mat-cell *matCellDef="let a"><span class="mono muted">{{ a.operating_hours.toLocaleString() }}</span></td>
          </ng-container>
          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let a">
              <button mat-stroked-button class="action-btn" (click)="goStrategy(a.sub_class)">Strategy →</button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols; sticky:true"></tr>
          <tr mat-row *matRowDef="let r; columns:cols" class="clickable" (click)="goStrategy(r.sub_class)"></tr>
        </table>
      </div>
      <div class="pager">
        <span class="pager-info">{{ page()*PAGE_SIZE+1 }}–{{ Math.min((page()+1)*PAGE_SIZE, filtered().length) }} of {{ filtered().length }}</span>
        <div class="pager-btns">
          <button mat-stroked-button [disabled]="page()===0" (click)="prevPage()">← Prev</button>
          <button mat-stroked-button [disabled]="page()>=totalPages()-1" (click)="nextPage()">Next →</button>
        </div>
      </div>
    </mat-card>
  `,
  styles: [`
    :host { display:flex; flex-direction:column; gap:14px; animation:fadeUp .25s ease; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
    .filter-card, .table-card { padding:14px !important; }
    .filter-row { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
    .search-field { flex:1; min-width:260px; }
    .chip-group { display:flex; gap:5px; align-items:center; flex-wrap:wrap; }
    .chip-label { font-family:'IBM Plex Mono',monospace; font-size:8.5px; color:var(--t3); }
    .card-hdr { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
    .ct { font-family:'IBM Plex Mono',monospace; font-size:9px; letter-spacing:1.2px; text-transform:uppercase; color:var(--t3); }
    .record-count { font-family:'IBM Plex Mono',monospace; font-size:9px; color:var(--t3); }
    .mono { font-family:'IBM Plex Mono',monospace; font-size:9px;
      &.amber{color:var(--amber)} &.muted{color:var(--t3)} &.small{font-size:8px} }
    .crit-pips { display:flex; gap:3px; }
    .pip { width:8px; height:8px; border-radius:50%; }
    .action-btn { font-family:'IBM Plex Mono',monospace !important; font-size:8.5px !important;
      height:26px !important; border-color:var(--bright) !important; color:var(--t2) !important; }
    .clickable:hover { cursor:pointer; }
    .pager { display:flex; justify-content:space-between; align-items:center; margin-top:10px;
      padding-top:8px; border-top:1px solid var(--border); }
    .pager-info { font-family:'IBM Plex Mono',monospace; font-size:9px; color:var(--t3); }
    .pager-btns { display:flex; gap:6px; }
    .pager-btns button { font-family:'IBM Plex Mono',monospace !important; font-size:9px !important;
      height:28px !important; border-color:var(--bright) !important; color:var(--t2) !important; }
  `]
})
export class AssetsComponent {
  private data   = inject(DataService);
  private router = inject(Router);
  private exp    = inject(ExportService);
  readonly f     = inject(FilterService);
  readonly CLASS_NAMES  = CLASS_NAMES;
  readonly CLASS_COLORS = CLASS_COLORS;
  readonly CRIT_COLORS  = CRIT_COLORS;
  readonly PAGE_SIZE    = PAGE_SIZE;
  readonly Math         = Math;
  readonly classKeys    = Object.keys(CLASS_NAMES) as EquipmentClass[];
  readonly cols = ['asset_id','description','class','sub_class','floc','manufacturer','criticality','status','operating_hours','action'];

  searchTerm = '';
  readonly classFilt = this.f.assetClassFilter;
  readonly critFilt  = this.f.assetCritFilter;
  readonly page      = signal(0);

  readonly filtered = computed(() => {
    const q = this.f.assetSearch().toLowerCase();
    const cls = this.classFilt(); const crit = this.critFilt();
    return this.data.assets.filter(a => {
      if (cls !== 'ALL' && a.class !== cls) return false;
      if (crit !== 'ALL' && String(a.criticality) !== crit) return false;
      if (q && !a.asset_id.toLowerCase().includes(q) &&
               !a.description.toLowerCase().includes(q) &&
               !a.manufacturer.toLowerCase().includes(q)) return false;
      return true;
    });
  });
  readonly paged       = computed(() => this.filtered().slice(this.page()*PAGE_SIZE, (this.page()+1)*PAGE_SIZE));
  readonly totalPages  = computed(() => Math.ceil(this.filtered().length / PAGE_SIZE) || 1);

  onSearch() { this.f.assetSearch.set(this.searchTerm); this.page.set(0); }
  setClass(v: string) { this.f.assetClassFilter.set(v); this.page.set(0); }
  setCrit(v: string)  { this.f.assetCritFilter.set(v);  this.page.set(0); }
  prevPage() { this.page.update(p => p - 1); }
  nextPage() { this.page.update(p => p + 1); }
  statusCls(s: string) { return {Active:'ok',Standby:'info',Decommissioned:'neutral'}[s] ?? 'neutral'; }
  goStrategy(sc: string) { this.f.stratClassFilter.set(this.data.SC[sc]?.cls ?? 'ALL'); this.router.navigate(['/strategies']); }

  async onExportXlsx() {
    await this.exp.exportXlsx(this.filtered() as any, [
      {key:'asset_id',label:'Asset ID',width:16},{key:'description',label:'Description',width:34},
      {key:'class',label:'Class',width:10},{key:'sub_class',label:'Sub-class',width:12},
      {key:'floc',label:'FLOC',width:20},{key:'manufacturer',label:'Manufacturer',width:20},
      {key:'criticality',label:'Criticality',width:12},{key:'status',label:'Status',width:14},
      {key:'operating_hours',label:'Op. Hours',width:12}
    ], 'Cordant_Assets', 'Assets');
  }
  async onExportPdf() {
    await this.exp.exportPdf(this.filtered().slice(0,200) as any, [
      {key:'asset_id',label:'Asset ID',width:18},{key:'description',label:'Description',width:36},
      {key:'class',label:'Cls',width:8},{key:'floc',label:'FLOC',width:22},
      {key:'manufacturer',label:'Manufacturer',width:18},{key:'criticality',label:'Crit',width:8},
      {key:'status',label:'Status',width:14}
    ], 'Cordant_Assets', 'Asset Register', '500 assets · 22 sub-classes');
  }
}
