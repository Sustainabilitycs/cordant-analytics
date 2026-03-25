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
import { FilterService } from '../../core/services/filter.service';
import { ExportService } from '../../core/services/export.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { WO_COLORS, WO_FULL_NAMES, WoType } from '../../core/models/cordant.models';

const PS = 20;

@Component({
  selector: 'ce-work-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatTableModule, MatFormFieldModule, MatInputModule, MatIconModule,
    PageHeaderComponent, KpiCardComponent],
  template: `
    <ce-page-header title="Work Orders"
      [subtitle]="data.workOrders.length.toLocaleString() + ' RECORDS · YTD 2024'"
      highlight="PM · CM · PdM · INSPECTION"
      (exportXlsx)="onExportXlsx()" (exportPdf)="onExportPdf()">
    </ce-page-header>

    <div class="grid-4">
      <ce-kpi-card title="COMPLETED" [value]="kpiCompleted()" subtitle="Closed YTD" accent="green"></ce-kpi-card>
      <ce-kpi-card title="IN PROGRESS" [value]="kpiInProgress()" subtitle="Currently open" accent="amber"></ce-kpi-card>
      <ce-kpi-card title="PLANNED" [value]="kpiPlanned()" subtitle="Scheduled ahead" accent="blue"></ce-kpi-card>
      <ce-kpi-card title="CM RATIO" [value]="kpiCmRatio()" unit="%" subtitle="Corrective vs total" accent="red"></ce-kpi-card>
    </div>

    <mat-card style="padding:14px">
      <div class="card-hdr">
        <span class="ct">WORK ORDER REGISTER</span>
      </div>
      <div class="filter-row">
        <mat-form-field appearance="outline" style="flex:1;min-width:220px">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput placeholder="Search WO#, asset, task..." [(ngModel)]="q" (ngModelChange)="onSearch()">
        </mat-form-field>
        <div class="chip-group">
          <span class="chip-lbl">TYPE:</span>
          <button class="filter-chip" *ngFor="let t of ['ALL','PM','CM','PdM','Inspection']"
            [class.active]="typeFilt()===t" (click)="setType(t)">{{ t==='Inspection'?'INSP':t }}</button>
        </div>
        <div class="chip-group">
          <span class="chip-lbl">PRIORITY:</span>
          <button class="filter-chip" *ngFor="let p of ['ALL','Critical','High']"
            [class.active]="priFilt()===p" (click)="setPri(p)">{{ p }}</button>
        </div>
      </div>
      <div style="overflow-x:auto">
        <table mat-table [dataSource]="paged()">
          <ng-container matColumnDef="wo_number">
            <th mat-header-cell *matHeaderCellDef>WO #</th>
            <td mat-cell *matCellDef="let w"><span class="mono amber">{{ w.wo_number }}</span></td>
          </ng-container>
          <ng-container matColumnDef="asset_id">
            <th mat-header-cell *matHeaderCellDef>ASSET</th>
            <td mat-cell *matCellDef="let w"><span class="mono">{{ w.asset_id }}</span></td>
          </ng-container>
          <ng-container matColumnDef="wo_type">
            <th mat-header-cell *matHeaderCellDef>TYPE</th>
            <td mat-cell *matCellDef="let w"><span class="badge info">{{ w.wo_type }}</span></td>
          </ng-container>
          <ng-container matColumnDef="task">
            <th mat-header-cell *matHeaderCellDef>TASK</th>
            <td mat-cell *matCellDef="let w" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ w.task_description }}</td>
          </ng-container>
          <ng-container matColumnDef="priority">
            <th mat-header-cell *matHeaderCellDef>PRIORITY</th>
            <td mat-cell *matCellDef="let w"><span class="badge" [ngClass]="priCls(w.priority)">{{ w.priority }}</span></td>
          </ng-container>
          <ng-container matColumnDef="planned_date">
            <th mat-header-cell *matHeaderCellDef>DATE</th>
            <td mat-cell *matCellDef="let w"><span class="mono muted">{{ w.planned_date }}</span></td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>STATUS</th>
            <td mat-cell *matCellDef="let w"><span class="badge" [ngClass]="statCls(w.status)">{{ w.status }}</span></td>
          </ng-container>
          <ng-container matColumnDef="technician">
            <th mat-header-cell *matHeaderCellDef>TECH</th>
            <td mat-cell *matCellDef="let w" style="white-space:nowrap">{{ w.technician_name.split(' ').slice(0,2).join(' ') }}</td>
          </ng-container>
          <ng-container matColumnDef="cost">
            <th mat-header-cell *matHeaderCellDef>COST</th>
            <td mat-cell *matCellDef="let w"><span class="mono green">{{ w.cost_usd ? '$'+Math.round(w.cost_usd).toLocaleString() : '—' }}</span></td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols;sticky:true"></tr>
          <tr mat-row *matRowDef="let r;columns:cols"></tr>
        </table>
      </div>
      <div class="pager">
        <span class="pi">{{ page()*PS+1 }}–{{ Math.min((page()+1)*PS,filtered().length) }} of {{ filtered().length.toLocaleString() }}</span>
        <div style="display:flex;gap:6px">
          <button mat-stroked-button [disabled]="page()===0" (click)="prevPage()">← Prev</button>
          <button mat-stroked-button [disabled]="page()>=tp()-1" (click)="nextPage()">Next →</button>
        </div>
      </div>
    </mat-card>
  `,
  styles: [`:host{display:flex;flex-direction:column;gap:14px;animation:fadeUp .25s ease}
    @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .card-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
    .ct{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:1.2px;text-transform:uppercase;color:var(--t3)}
    .filter-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px}
    .chip-group{display:flex;gap:4px;align-items:center;flex-wrap:wrap}
    .chip-lbl{font-family:'IBM Plex Mono',monospace;font-size:8.5px;color:var(--t3)}
    .mono{font-family:'IBM Plex Mono',monospace;font-size:9px;&.amber{color:var(--amber)}&.muted{color:var(--t3)}&.green{color:var(--green)}}
    .pager{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:8px;border-top:1px solid var(--border)}
    .pi{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--t3)}`]
})
export class WorkOrdersComponent {
  readonly data = inject(DataService);
  private exp   = inject(ExportService);
  readonly f    = inject(FilterService);
  readonly Math = Math;
  readonly PS   = PS;
  readonly cols = ['wo_number','asset_id','wo_type','task','priority','planned_date','status','technician','cost'];

  q = '';
  readonly typeFilt = this.f.woTypeFilter;
  readonly priFilt  = this.f.woPriFilter;
  readonly page     = signal(0);

  readonly filtered = computed(() => {
    const q = this.f.woSearchFilter().toLowerCase();
    const t = this.typeFilt(); const p = this.priFilt();
    return this.data.workOrders.filter(w => {
      if (t !== 'ALL' && w.wo_type !== t) return false;
      if (p !== 'ALL' && w.priority !== p) return false;
      if (q && !w.wo_number.toLowerCase().includes(q) && !w.asset_id.toLowerCase().includes(q) && !(w.task_description||'').toLowerCase().includes(q)) return false;
      return true;
    });
  });
  readonly paged = computed(() => this.filtered().slice(this.page()*PS, (this.page()+1)*PS));
  readonly tp    = computed(() => Math.ceil(this.filtered().length/PS)||1);

  readonly kpiCompleted   = computed(() => this.data.workOrders.filter(w=>w.status==='Completed'||w.status==='Closed').length.toLocaleString());
  readonly kpiInProgress  = computed(() => this.data.workOrders.filter(w=>w.status==='In Progress').length.toLocaleString());
  readonly kpiPlanned     = computed(() => this.data.workOrders.filter(w=>w.status==='Planned').length.toLocaleString());
  readonly kpiCmRatio     = computed(() => Math.round(this.data.workOrders.filter(w=>w.wo_type==='CM').length/this.data.workOrders.length*100).toString());

  onSearch() { this.f.woSearchFilter.set(this.q); this.page.set(0); }
  setType(v: string) { this.f.woTypeFilter.set(v); this.page.set(0); }
  setPri(v: string)  { this.f.woPriFilter.set(v);  this.page.set(0); }
  priCls(p: string)  { return {Critical:'crit',High:'warn',Medium:'info',Low:'neutral'}[p]??'neutral'; }
  statCls(s: string) { return {Completed:'ok',Closed:'ok','In Progress':'warn',Planned:'info',Cancelled:'neutral'}[s]??'neutral'; }

  prevPage() { if(this.page()>0) this.page.update(p=>p-1); }
  nextPage() { if(this.page()<this.tp()-1) this.page.update(p=>p+1); }

  async onExportXlsx() {
    await this.exp.exportXlsx(this.filtered() as any,[
      {key:'wo_number',label:'WO #',width:14},{key:'asset_id',label:'Asset',width:16},
      {key:'wo_type',label:'Type',width:12},{key:'task_description',label:'Task',width:30},
      {key:'priority',label:'Priority',width:12},{key:'planned_date',label:'Date',width:14},
      {key:'status',label:'Status',width:14},{key:'technician_name',label:'Technician',width:20},
      {key:'cost_usd',label:'Cost USD',width:12}
    ],'Cordant_WorkOrders','Work Orders');
  }
  async onExportPdf() {
    await this.exp.exportPdf(this.filtered().slice(0,200) as any,[
      {key:'wo_number',label:'WO #',width:18},{key:'asset_id',label:'Asset',width:18},
      {key:'wo_type',label:'Type',width:12},{key:'task_description',label:'Task',width:32},
      {key:'priority',label:'Priority',width:14},{key:'status',label:'Status',width:14},
      {key:'cost_usd',label:'Cost',width:12}
    ],'Cordant_WorkOrders','Work Orders','YTD 2024');
  }
}
