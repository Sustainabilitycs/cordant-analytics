import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';


import { DataService } from '../../core/services/data.service';
import { FilterService } from '../../core/services/filter.service';
import { ExportService } from '../../core/services/export.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { CLASS_NAMES, CLASS_COLORS, EquipmentClass, Strategy } from '../../core/models/cordant.models';

@Component({
  selector: 'ce-strategies',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatIconModule, MatSnackBarModule, PageHeaderComponent],
  template: `
    <ce-page-header title="Strategy Library"
      subtitle="97 STRATEGIES · RCM BASED"
      highlight="TAILORABLE PER ASSET"
      (exportXlsx)="onExportXlsx()" (exportPdf)="onExportPdf()">
    </ce-page-header>

    <div class="grid-2">
      <!-- Strategy list -->
      <mat-card style="padding:14px">
        <div class="card-hdr">
          <span class="ct">GENERIC STRATEGIES</span>
          <span class="rc">{{ filtered().length }} of {{ data.strategies.length }}</span>
        </div>
        <div class="filter-row">
          <mat-form-field appearance="outline" style="flex:1">
            <input matInput placeholder="Search task, class..." [(ngModel)]="q" (ngModelChange)="page.set(0)">
          </mat-form-field>
          <div class="chip-group">
            <button class="filter-chip" [class.active]="f.stratClassFilter()==='ALL'" (click)="f.stratClassFilter.set('ALL')">ALL</button>
            <button class="filter-chip" *ngFor="let cls of classKeys"
              [class.active]="f.stratClassFilter()===cls" (click)="f.stratClassFilter.set(cls)"
              [style.border-color]="f.stratClassFilter()===cls?CLASS_COLORS[cls]:''"
              [style.color]="f.stratClassFilter()===cls?CLASS_COLORS[cls]:''">
              <span class="tag" [ngClass]="cls">{{ cls }}</span>
            </button>
          </div>
        </div>
        <div style="max-height:500px;overflow-y:auto">
          <table mat-table [dataSource]="paged()">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef>STRATEGY ID</th>
              <td mat-cell *matCellDef="let s"><span class="mono amber small">{{ s.strategy_id }}</span></td>
            </ng-container>
            <ng-container matColumnDef="class">
              <th mat-header-cell *matHeaderCellDef>CLASS</th>
              <td mat-cell *matCellDef="let s">
                <span class="tag" [ngClass]="s.class">{{ s.class }}</span>
                <span class="mono muted small" style="margin-left:4px">{{ s.sub_class }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="task">
              <th mat-header-cell *matHeaderCellDef>TASK</th>
              <td mat-cell *matCellDef="let s">{{ s.task_name }}</td>
            </ng-container>
            <ng-container matColumnDef="freq">
              <th mat-header-cell *matHeaderCellDef>FREQ</th>
              <td mat-cell *matCellDef="let s">
                <span class="badge" [ngClass]="freqCls(s.frequency)">{{ s.frequency }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="rcm">
              <th mat-header-cell *matHeaderCellDef>RCM TYPE</th>
              <td mat-cell *matCellDef="let s"><span class="muted-text">{{ s.rcm_type }}</span></td>
            </ng-container>
            <ng-container matColumnDef="hrs">
              <th mat-header-cell *matHeaderCellDef>HRS</th>
              <td mat-cell *matCellDef="let s"><span class="mono muted">{{ s.est_duration_h }}h</span></td>
            </ng-container>
            <ng-container matColumnDef="action">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let s">
                <button mat-stroked-button class="edit-btn" (click)="selectStrategy(s)">Edit</button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols;sticky:true"></tr>
            <tr mat-row *matRowDef="let r;columns:cols" class="clickable"
              [class.selected]="selectedId()===r.strategy_id"
              (click)="selectStrategy(r)"></tr>
          </table>
        </div>
        <div class="pager">
          <span class="pi">{{ page()*20+1 }}–{{ Math.min((page()+1)*20,filtered().length) }} of {{ filtered().length }}</span>
          <div style="display:flex;gap:5px">
            <button mat-stroked-button [disabled]="page()===0" (click)="prevPage()">← Prev</button>
            <button mat-stroked-button [disabled]="page()>=(Math.ceil(filtered().length/20)||1)-1" (click)="nextPage()">Next →</button>
          </div>
        </div>
      </mat-card>

      <!-- Strategy detail / edit -->
      <mat-card style="padding:14px">
        <div *ngIf="!selected(); else editPanel">
          <p style="color:var(--t3);font-size:10.5px;padding:20px 0">← Select a strategy to view and edit</p>
        </div>
        <ng-template #editPanel>
          <div *ngIf="selected() as s">
            <div class="detail-header">
              <div>
                <div style="font-family:'Rajdhani',sans-serif;font-size:18px;font-weight:700">{{ s.task_name }}</div>
                <div class="mono amber small" style="margin-top:2px">{{ s.strategy_id }}</div>
              </div>
              <span class="tag" [ngClass]="s.class">{{ s.class }}</span>
            </div>
            <!-- Info grid -->
            <div class="info-grid" style="margin:12px 0">
              <div class="info-cell" *ngFor="let item of detailItems(s)">
                <div class="info-label">{{ item.label }}</div>
                <div class="info-value">{{ item.value }}</div>
              </div>
            </div>
            <!-- Edit form -->
            <div class="ct" style="margin-bottom:8px">TAILOR THIS STRATEGY</div>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Frequency</mat-label>
                <mat-select [(ngModel)]="editFreq">
                  <mat-option *ngFor="let f of freqs" [value]="f">{{ f }}</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>RCM Type</mat-label>
                <mat-select [(ngModel)]="editRcm">
                  <mat-option *ngFor="let r of rcmTypes" [value]="r">{{ r }}</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" style="max-width:120px">
                <mat-label>Duration (h)</mat-label>
                <input matInput type="number" [(ngModel)]="editDur" step="0.25">
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" style="width:100%">
              <mat-label>Reason for change</mat-label>
              <input matInput [(ngModel)]="editReason" placeholder="e.g. OEM recommendation, RCM analysis...">
            </mat-form-field>
            <button mat-flat-button color="primary" class="save-btn" (click)="save()">Save & Log to Audit Trail</button>
          </div>
        </ng-template>
      </mat-card>
    </div>
  `,
  styles: [`:host{display:flex;flex-direction:column;gap:14px;animation:fadeUp .25s ease}
    @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .card-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
    .ct{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:1.2px;text-transform:uppercase;color:var(--t3)}
    .rc{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--t3)}
    .filter-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px}
    .chip-group{display:flex;gap:4px;flex-wrap:wrap}
    .mono{font-family:'IBM Plex Mono',monospace;font-size:9px;&.amber{color:var(--amber)}&.muted{color:var(--t3)}&.small{font-size:8px}}
    .muted-text{font-size:9.5px;color:var(--t2)}
    .edit-btn{font-family:'IBM Plex Mono',monospace!important;font-size:8.5px!important;height:26px!important;border-color:var(--bright)!important;color:var(--t2)!important}
    .clickable{cursor:pointer} .selected td{background:var(--amberG)!important}
    .pager{display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid var(--border)}
    .pi{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--t3)}
    .detail-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
    .info-cell{background:var(--el);border-radius:3px;padding:7px}
    .info-label{font-family:'IBM Plex Mono',monospace;font-size:7.5px;color:var(--t3);margin-bottom:1px}
    .info-value{font-size:10.5px;font-weight:500}
    .form-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:4px}
    .save-btn{font-family:'IBM Plex Mono',monospace!important;font-size:9.5px!important;letter-spacing:.4px!important}
  `]
})
export class StrategiesComponent {
  readonly data  = inject(DataService);
  readonly f     = inject(FilterService);
  private exp    = inject(ExportService);
  private snack  = inject(MatSnackBar);
  readonly Math  = Math;
  readonly CLASS_COLORS = CLASS_COLORS;
  readonly classKeys    = Object.keys(CLASS_NAMES) as EquipmentClass[];
  readonly cols         = ['id','class','task','freq','rcm','hrs','action'];
  readonly freqs        = ['15min','monthly','quarterly','6-monthly','annual','2-year'];
  readonly rcmTypes     = ['Time-based','Condition-based','Predictive','Failure-finding'];

  q = ''; page = signal(0); selectedId = signal<string|null>(null);
  editFreq = ''; editRcm = ''; editDur = 1; editReason = '';

  readonly filtered = computed(() => {
    const q = this.q.toLowerCase(); const cls = this.f.stratClassFilter();
    return this.data.strategies.filter(s => {
      if (cls !== 'ALL' && s.class !== cls) return false;
      if (q && !s.task_name.toLowerCase().includes(q) && !s.sub_class.toLowerCase().includes(q)) return false;
      return true;
    });
  });
  readonly paged    = computed(() => this.filtered().slice(this.page()*20,(this.page()+1)*20));
  readonly selected = computed(() => this.data.strategies.find(s=>s.strategy_id===this.selectedId())||null);

  prevPage() { if(this.page()>0) this.page.update(p=>p-1); }
  nextPage() { if(this.page()<(Math.ceil(this.filtered().length/20)||1)-1) this.page.update(p=>p+1); }

  selectStrategy(s: Strategy) {
    this.selectedId.set(s.strategy_id);
    this.editFreq = s.frequency; this.editRcm = s.rcm_type;
    this.editDur = s.est_duration_h; this.editReason = '';
  }

  detailItems(s: Strategy) {
    return [
      {label:'RCM TYPE', value:s.rcm_type},
      {label:'FREQUENCY', value:s.frequency},
      {label:'INTERVAL', value:s.interval_days ? s.interval_days+' days' : 'Continuous'},
      {label:'SKILL', value:s.skill_required},
      {label:'EST. DURATION', value:s.est_duration_h+'h'},
      {label:'VERSION', value:'v'+s.version},
      {label:'ASSETS AFFECTED', value:this.data.assets.filter(a=>a.sub_class===s.sub_class).length+' assets'},
      {label:'AUDIT CHANGES', value:this.data.auditRecords.filter(a=>a.strategy_id===s.strategy_id).length+' changes'},
    ];
  }

  save() {
    if (!this.editReason.trim()) { this.snack.open('Please enter a reason', 'OK', {duration:3000}); return; }
    const s = this.selected(); if (!s) return;
    this.data.addAuditRecord({
      audit_id: `AUD-LIVE-${Date.now()}`,
      strategy_id: s.strategy_id, sub_class: s.sub_class, asset_id: null,
      change_date: new Date().toISOString().replace('T',' ').substring(0,19),
      changed_by_name: 'Current User',
      field_changed: 'frequency+rcm_type+est_duration_h',
      old_value: `${s.frequency}|${s.rcm_type}|${s.est_duration_h}h`,
      new_value: `${this.editFreq}|${this.editRcm}|${this.editDur}h`,
      reason: this.editReason, approved_by: 'Robert Steele'
    });
    s.frequency = this.editFreq; s.rcm_type = this.editRcm as any;
    s.est_duration_h = this.editDur;
    this.snack.open('✓ Strategy updated and logged to audit trail', '', {duration:3500});
  }

  freqCls(f: string) { return {['15min']:'crit',monthly:'warn',quarterly:'info'}[f]??'neutral'; }

  async onExportXlsx() {
    await this.exp.exportXlsx(this.filtered() as any,[
      {key:'strategy_id',label:'Strategy ID',width:24},{key:'sub_class',label:'Sub-class',width:10},
      {key:'class',label:'Class',width:8},{key:'task_name',label:'Task',width:28},
      {key:'frequency',label:'Frequency',width:14},{key:'rcm_type',label:'RCM Type',width:18},
      {key:'skill_required',label:'Skill',width:16},{key:'est_duration_h',label:'Duration (h)',width:14}
    ],'Cordant_Strategies','Strategies');
  }
  async onExportPdf() {
    await this.exp.exportPdf(this.filtered() as any,[
      {key:'strategy_id',label:'Strategy ID',width:24},{key:'sub_class',label:'Sub-class',width:12},
      {key:'task_name',label:'Task',width:36},{key:'frequency',label:'Frequency',width:14},
      {key:'rcm_type',label:'RCM Type',width:20},{key:'est_duration_h',label:'Hrs',width:8}
    ],'Cordant_Strategies','Strategy Library','97 RCM-based strategies');
  }
}
