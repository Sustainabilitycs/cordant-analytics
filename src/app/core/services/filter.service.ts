import { Injectable, signal, computed } from '@angular/core';
import { EquipmentClass, WoType, DashboardFilters } from '../models/cordant.models';

@Injectable({ providedIn: 'root' })
export class FilterService {

  // ── DASHBOARD CROSS-FILTER STATE (signals) ───────────────────
  readonly activeClass = signal<EquipmentClass | null>(null);
  readonly activeCrit  = signal<number | null>(null);
  readonly activeType  = signal<WoType | null>(null);
  readonly woPage      = signal<number>(0);

  readonly hasFilters = computed(() =>
    this.activeClass() !== null ||
    this.activeCrit()  !== null ||
    this.activeType()  !== null
  );

  readonly filterLabel = computed(() => {
    const parts: string[] = [];
    if (this.activeClass()) parts.push(`Class: ${this.activeClass()}`);
    if (this.activeCrit())  parts.push(`Crit: ${this.activeCrit()}`);
    if (this.activeType())  parts.push(`Type: ${this.activeType()}`);
    return parts.join(' · ');
  });

  setClass(cls: EquipmentClass | null): void {
    this.activeClass.set(this.activeClass() === cls ? null : cls);
    this.woPage.set(0);
  }

  setCrit(crit: number | null): void {
    this.activeCrit.set(this.activeCrit() === crit ? null : crit);
    this.woPage.set(0);
  }

  setType(type: WoType | null): void {
    this.activeType.set(this.activeType() === type ? null : type);
    this.woPage.set(0);
  }

  resetAll(): void {
    this.activeClass.set(null);
    this.activeCrit.set(null);
    this.activeType.set(null);
    this.woPage.set(0);
  }

  getFilters(): DashboardFilters {
    return {
      activeClass: this.activeClass(),
      activeCrit:  this.activeCrit(),
      activeType:  this.activeType(),
      woPage:      this.woPage()
    };
  }

  // ── ASSET PAGE FILTERS ────────────────────────────────────────
  readonly assetClassFilter = signal<string>('ALL');
  readonly assetCritFilter  = signal<string>('ALL');
  readonly assetSearch      = signal<string>('');

  // ── WORK ORDER FILTERS ────────────────────────────────────────
  readonly woTypeFilter   = signal<string>('ALL');
  readonly woPriFilter    = signal<string>('ALL');
  readonly woSearchFilter = signal<string>('');

  // ── STRATEGY FILTERS ─────────────────────────────────────────
  readonly stratClassFilter  = signal<string>('ALL');
  readonly stratSearchFilter = signal<string>('');

  // ── AUDIT FILTERS ─────────────────────────────────────────────
  readonly auditLevelFilter  = signal<string>('ALL');
  readonly auditSearchFilter = signal<string>('');

  // ── SENSOR FILTERS ────────────────────────────────────────────
  readonly sensorAlertFilter = signal<boolean>(false);
  readonly sensorSearch      = signal<string>('');

  // ── EMS FILTERS ───────────────────────────────────────────────
  readonly emsPeriod    = signal<string>('YTD');
  readonly emsClass     = signal<string>('ALL');
  readonly emsPieMode   = signal<'cost' | 'kwh'>('cost');
}
