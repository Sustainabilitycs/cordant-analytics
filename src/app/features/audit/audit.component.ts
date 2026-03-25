import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DataService } from '../../core/services/data.service';
import { ExportService } from '../../core/services/export.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';

const PS = 20;

@Component({
  selector: 'ce-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatTableModule, MatFormFieldModule, MatInputModule, PageHeaderComponent, KpiCardComponent],
  template: `
    <ce-page-header title="Audit Trail" subtitle="STRATEGY CHANGES · ASSET TAILORING" highlight="FULL GOVERNANCE LOG"
      (exportXlsx)="onExportXlsx()" (exportPdf)="onExportPdf()"></ce-page-header>
    <div class="grid-4">
      <ce-kpi-card title="TOTAL CHANGES" [value]="data.auditRecords.length.toLocaleString()" subtitle="YTD 2024" accent="amber"></ce-kpi-card>
      <ce-kpi-card title="STRATEGY-LEVEL" [value]="stratCount()" subtitle="Generic changes" accent="neutral"></ce-kpi-card>
      <ce-kpi-card title="ASSET-LEVEL" [value]="assetCount()" subtitle="Asset tailoring" accent="neutral"></ce-kpi-card>
      <ce-kpi-card title="CONTRIBUTORS" [value]="contribs()" subtitle="Unique contributors" accent="neutral"></ce-kpi-card>
    </div>
    <mat-card style="padding:14px">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px">
        <mat-form-field appearance="outline" style="flex:1;min-width:220px">
          <input matInput placeholder="Search strategy, reason, person..." [(ngModel)]="q">
        </mat-form-field>
        <button class="filter-chip" *ngFor="let l of ['ALL','strategy','asset']"
          [class.active]="levelFilt()===l" (click)="levelFilt.set(l);page.set(0)">{{ l.toUpperCase() }}</button>
      </div>
      <div style="overflow-x:auto">
        <table mat-table [dataSource]="paged()">
          <ng-container matColumnDef="audit_id"><th mat-header-cell *matHeaderCellDef>AUDIT ID</th><td mat-cell *matCellDef="let a"><span class="mono amber">{{ a.audit_id }}</span></td></ng-container>
          <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>DATE</th><td mat-cell *matCellDef="let a"><span class="mono muted">{{ a.change_date.substring(0,16) }}</span></td></ng-container>
          <ng-container matColumnDef="strategy"><th mat-header-cell *matHeaderCellDef>STRATEGY</th><td mat-cell *matCellDef="let a"><span class="mono small">{{ a.strategy_id }}</span></td></ng-container>
          <ng-container matColumnDef="asset"><th mat-header-cell *matHeaderCellDef>ASSET</th><td mat-cell *matCellDef="let a"><span class="mono muted small">{{ a.asset_id || 'generic' }}</span></td></ng-container>
          <ng-container matColumnDef="field"><th mat-header-cell *matHeaderCellDef>FIELD</th><td mat-cell *matCellDef="let a"><span class="badge info">{{ a.field_changed }}</span></td></ng-container>
          <ng-container matColumnDef="old_val"><th mat-header-cell *matHeaderCellDef>OLD</th><td mat-cell *matCellDef="let a"><span class="mono" style="color:var(--red)">{{ a.old_value }}</span></td></ng-container>
          <ng-container matColumnDef="new_val"><th mat-header-cell *matHeaderCellDef>NEW</th><td mat-cell *matCellDef="let a"><span class="mono" style="color:var(--green)">{{ a.new_value }}</span></td></ng-container>
          <ng-container matColumnDef="by"><th mat-header-cell *matHeaderCellDef>CHANGED BY</th><td mat-cell *matCellDef="let a">{{ a.changed_by_name }}</td></ng-container>
          <ng-container matColumnDef="reason"><th mat-header-cell *matHeaderCellDef>REASON</th><td mat-cell *matCellDef="let a" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ a.reason }}</td></ng-container>
          <ng-container matColumnDef="approved"><th mat-header-cell *matHeaderCellDef>APPROVED BY</th><td mat-cell *matCellDef="let a" style="white-space:nowrap">{{ a.approved_by }}</td></ng-container>
          <tr mat-header-row *matHeaderRowDef="cols;sticky:true"></tr>
          <tr mat-row *matRowDef="let r;columns:cols"></tr>
        </table>
      </div>
      <div class="pager">
        <span class="pi">{{ page()*PS+1 }}–{{ Math.min((page()+1)*PS,filtered().length) }} of {{ filtered().length }}</span>
        <div style="display:flex;gap:5px">
          <button mat-stroked-button [disabled]="page()===0" (click)="prevPage()">← Prev</button>
          <button mat-stroked-button [disabled]="page()>=(Math.ceil(filtered().length/PS)||1)-1" (click)="nextPage()">Next →</button>
        </div>
      </div>
    </mat-card>
  `,
  styles: [`:host{display:flex;flex-direction:column;gap:14px;animation:fadeUp .25s ease}@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.mono{font-family:'IBM Plex Mono',monospace;font-size:9px;&.amber{color:var(--amber)}&.muted{color:var(--t3)}&.small{font-size:8px}}.pager{display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid var(--border)}.pi{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--t3)}`]
})
export class AuditComponent {
  readonly data = inject(DataService);
  private exp   = inject(ExportService);
  readonly Math = Math; readonly PS = PS;
  readonly cols = ['audit_id','date','strategy','asset','field','old_val','new_val','by','reason','approved'];
  q = ''; levelFilt = signal('ALL'); page = signal(0);
  stratCount() { return this.data.auditRecords.filter(a=>!a.asset_id).length.toString(); }
  assetCount() { return this.data.auditRecords.filter(a=>!!a.asset_id).length.toString(); }
  contribs()   { return new Set(this.data.auditRecords.map(a=>a.changed_by_name)).size.toString(); }
  readonly filtered = computed(() => {
    const q=this.q.toLowerCase(), l=this.levelFilt();
    return this.data.auditRecords.filter(a=>{
      if(l==='strategy'&&a.asset_id!==null) return false;
      if(l==='asset'&&a.asset_id===null) return false;
      if(q&&!a.strategy_id.toLowerCase().includes(q)&&!(a.asset_id||'').toLowerCase().includes(q)&&!a.reason.toLowerCase().includes(q)&&!a.changed_by_name.toLowerCase().includes(q)) return false;
      return true;
    });
  });
  readonly paged = computed(()=>this.filtered().slice(this.page()*PS,(this.page()+1)*PS));
  prevPage() { if(this.page()>0) this.page.update(p=>p-1); }
  nextPage() { if(this.page()<(Math.ceil(this.filtered().length/this.PS)||1)-1) this.page.update(p=>p+1); }

  async onExportXlsx() {
    await this.exp.exportXlsx(this.filtered() as any,[
      {key:'audit_id',label:'Audit ID',width:16},{key:'change_date',label:'Date',width:20},
      {key:'strategy_id',label:'Strategy',width:22},{key:'field_changed',label:'Field',width:16},
      {key:'old_value',label:'Old Value',width:16},{key:'new_value',label:'New Value',width:16},
      {key:'changed_by_name',label:'Changed By',width:20},{key:'reason',label:'Reason',width:30},
      {key:'approved_by',label:'Approved By',width:18}
    ],'Cordant_AuditTrail','Audit Trail');
  }
  async onExportPdf() {
    await this.exp.exportPdf(this.filtered().slice(0,200) as any,[
      {key:'audit_id',label:'Audit ID',width:16},{key:'change_date',label:'Date',width:18},
      {key:'strategy_id',label:'Strategy',width:20},{key:'field_changed',label:'Field',width:14},
      {key:'old_value',label:'Old',width:14},{key:'new_value',label:'New',width:14},
      {key:'changed_by_name',label:'By',width:18},{key:'reason',label:'Reason',width:28}
    ],'Cordant_AuditTrail','Audit Trail','Governance log');
  }
}
