import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { DataService } from '../../core/services/data.service';
import { ExportService } from '../../core/services/export.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { CLASS_COLORS } from '../../core/models/cordant.models';

@Component({
  selector: 'ce-floc',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, PageHeaderComponent],
  template: `
    <ce-page-header title="FLOC Hierarchy" subtitle="FUNCTIONAL LOCATIONS · 4 PLANTS · SYSTEM AGNOSTIC"
      (exportXlsx)="onExportXlsx()" (exportPdf)="onExportPdf()"></ce-page-header>
    <mat-card style="padding:14px">
      <div class="ct" style="margin-bottom:14px">PLANT STRUCTURE — CORDANT ENERGY</div>
      <div class="tree">
        <ng-container *ngFor="let plant of plants()">
          <div class="tree-plant">
            ▸ <span class="amber">{{ plant.id }}</span> — {{ plant.name }}
            <span class="count">({{ assetCount(plant.id) }} assets)</span>
          </div>
          <ng-container *ngFor="let area of children(plant.id)">
            <div class="tree-area">
              ├─ <span class="blue">{{ area.id }}</span> — {{ area.name }}
              <span class="count">({{ assetCount(area.id) }} assets)</span>
            </div>
            <div class="tree-skid" *ngFor="let skid of children(area.id)">
              └── <span class="skid-id" [style.color]="skid.class ? CLASS_COLORS[skid.class] : 'var(--t3)'">{{ skid.id }}</span>
              — {{ skid.name }}
              <span *ngIf="skid.class" class="tag" [ngClass]="skid.class" style="margin-left:6px">{{ skid.class }}</span>
              <span class="count">{{ assetCount(skid.id) }} assets</span>
            </div>
          </ng-container>
        </ng-container>
      </div>
    </mat-card>
  `,
  styles: [`:host{display:flex;flex-direction:column;gap:14px;animation:fadeUp .25s ease}@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.ct{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:1.2px;text-transform:uppercase;color:var(--t3)}.tree{font-family:'IBM Plex Mono',monospace;font-size:10px;line-height:2}.tree-plant{color:var(--amber);font-weight:500;margin-top:8px}.tree-area{padding-left:18px;color:var(--t2)}.tree-skid{padding-left:36px;color:var(--t3)}.amber{color:var(--amber)}.blue{color:var(--blue)}.count{color:var(--t3);margin-left:6px}.skid-id{font-weight:500}`]
})
export class FlocComponent {
  private data = inject(DataService);
  private exp  = inject(ExportService);
  readonly CLASS_COLORS = CLASS_COLORS;
  plants()         { return this.data.flocNodes.filter(n=>!n.parent); }
  children(id: string) { return this.data.flocNodes.filter(n=>n.parent===id); }
  assetCount(id: string) { return this.data.assets.filter(a=>a.floc.startsWith(id)).length; }

  async onExportXlsx() {
    const rows = this.data.flocNodes.map(n=>({
      id:n.id, name:n.name, parent:n.parent??'ROOT',
      class:n.class??'', asset_count:this.assetCount(n.id)
    }));
    await this.exp.exportXlsx(rows as any,[
      {key:'id',label:'FLOC ID',width:24},{key:'name',label:'Name',width:34},
      {key:'parent',label:'Parent',width:20},{key:'class',label:'Class',width:10},
      {key:'asset_count',label:'Asset Count',width:14}
    ],'Cordant_FLOC','FLOC Hierarchy');
  }
  async onExportPdf() {
    const rows = this.data.flocNodes.map(n=>({
      id:n.id, name:n.name, parent:n.parent??'ROOT', asset_count:this.assetCount(n.id)
    }));
    await this.exp.exportPdf(rows as any,[
      {key:'id',label:'FLOC ID',width:26},{key:'name',label:'Name',width:38},
      {key:'parent',label:'Parent',width:22},{key:'asset_count',label:'Assets',width:10}
    ],'Cordant_FLOC','FLOC Hierarchy','Functional location structure');
  }
}
