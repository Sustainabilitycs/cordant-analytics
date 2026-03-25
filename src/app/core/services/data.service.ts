import { Injectable } from '@angular/core';
import {
  Asset, WorkOrder, Strategy, AuditRecord, SensorReading,
  EnergyMonthly, FlocNode, EquipmentClass, WoType, WoPriority,
  WoStatus, AssetStatus, RcmType, MONTHS
} from '../models/cordant.models';

// ── SEEDED RNG ──────────────────────────────────────────────────
function mkRng(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}
function ri(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function rc<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

@Injectable({ providedIn: 'root' })
export class DataService {

  // ── CACHED DATA ───────────────────────────────────────────────
  private _assets:         Asset[]          | null = null;
  private _workOrders:     WorkOrder[]      | null = null;
  private _strategies:     Strategy[]       | null = null;
  private _auditRecords:   AuditRecord[]    | null = null;
  private _sensorReadings: SensorReading[]  | null = null;
  private _energyMonthly:  EnergyMonthly[]  | null = null;
  private _flocNodes:      FlocNode[]       | null = null;

  // ── SUBCLASS DEFINITIONS ──────────────────────────────────────
  readonly SC: Record<string, { cls: EquipmentClass; name: string }> = {
    PUGN:{cls:'PU',name:'General/Process Pump'},PUHY:{cls:'PU',name:'Hydraulic Pump'},
    PUDI:{cls:'PU',name:'Diaphragm Pump'},PUSK:{cls:'PU',name:'Submersible Pump'},
    MOSM:{cls:'MO',name:'Small Motor <15kW'},MOME:{cls:'MO',name:'Medium Motor 15-75kW'},
    MOLG:{cls:'MO',name:'Large Motor >75kW'},
    TRPR:{cls:'TR',name:'Pressure Transmitter'},TRTE:{cls:'TR',name:'Temp. Transmitter'},
    TRFL:{cls:'TR',name:'Flow Transmitter'},TRLE:{cls:'TR',name:'Level Transmitter'},
    SWPS:{cls:'SW',name:'Pressure Switch'},SWTS:{cls:'SW',name:'Temp. Switch'},
    SWGS:{cls:'SW',name:'Gas Detector H2S/CO2'},SWFS:{cls:'SW',name:'Flame/Fire Detector'},
    BRMV:{cls:'BR',name:'MV Circuit Breaker'},BRLV:{cls:'BR',name:'LV Circuit Breaker'},
    BRTR:{cls:'BR',name:'Transformer'},BRPN:{cls:'BR',name:'MCC / Panel'},
    VACV:{cls:'VA',name:'Control Valve'},VASV:{cls:'VA',name:'Safety/Relief Valve'},
    VAON:{cls:'VA',name:'On/Off Valve Actuated'},
  };

  private readonly COUNTS: Record<string, number> = {
    PUGN:30,PUHY:20,PUDI:15,PUSK:15,MOSM:50,MOME:45,MOLG:25,
    TRPR:55,TRTE:45,TRFL:35,TRLE:25,SWPS:20,SWTS:15,SWGS:15,SWFS:10,
    BRMV:15,BRLV:20,BRTR:10,BRPN:5,VACV:12,VASV:10,VAON:8
  };

  private readonly SC_AREA: Record<string, string> = {
    PUGN:'CE-PL01-PR-PU',PUHY:'CE-PL01-CO-PU',PUDI:'CE-PL02-HT-PU',PUSK:'CE-PL03-SE-PU',
    MOSM:'CE-PL01-PR-MO',MOME:'CE-PL02-HT-MO',MOLG:'CE-PL01-CO-MO',
    TRPR:'CE-PL01-PR-TR',TRTE:'CE-PL03-RX-TR',TRFL:'CE-PL02-PR-TR',TRLE:'CE-PL04-WA-TR',
    SWPS:'CE-PL03-RX-SW',SWTS:'CE-PL03-RX-SW',SWGS:'CE-PL03-RX-SW',SWFS:'CE-PL04-FS-SW',
    BRMV:'CE-PL04-EL-BR',BRLV:'CE-PL02-UT-BR',BRTR:'CE-PL04-EL-BR',BRPN:'CE-PL01-UT-BR',
    VACV:'CE-PL02-PR-VA',VASV:'CE-PL04-FS-VA',VAON:'CE-PL03-SE-VA'
  };

  private readonly MFR: Record<EquipmentClass, string[]> = {
    PU:['Flowserve','Sulzer','KSB','Grundfos','ITT'],
    MO:['ABB','Siemens','WEG','Nidec','Leroy-Somer'],
    TR:['Emerson','Endress+Hauser','Yokogawa','Honeywell','ABB'],
    SW:['Emerson','Pepperl+Fuchs','MSA Safety','Detechtion','Oldham'],
    BR:['Schneider Electric','ABB','Siemens','Eaton','GE'],
    VA:['Emerson','Flowserve','Metso','Samson','IMI']
  };

  private readonly TECHS = [
    'James Okafor','Aisha Mensah','Marco Delgado','Priya Nair',
    'Stefan Kovacs','Fatima Al-Hassan','Liam Brennan','Chen Wei'
  ];
  private readonly PLANNERS = ['Robert Steele','Sandra Osei','David Hartmann'];

  private readonly TASKS: Record<string, string[]> = {
    PUGN:['Vibration analysis','Seal inspection','Lubrication','Flow calibration','Impeller check'],
    PUHY:['Pressure test','Oil analysis','Seal check','Filter replacement','Alignment check'],
    PUDI:['Diaphragm inspection','Valve check','Stroke calibration','Leak test'],
    PUSK:['Motor insulation test','Cable inspection','Impeller check','Vibration analysis'],
    MOSM:['Lubrication','Vibration analysis','Insulation resistance','Temperature monitoring','Belt tension'],
    MOME:['Vibration analysis','Thermography','Lubrication','Alignment','Motor winding test'],
    MOLG:['Continuous vibration','Oil analysis','Stator temp monitoring','Partial discharge','Alignment'],
    TRPR:['Zero/span calibration','Loop check','Impulse line flush','Diaphragm inspect'],
    TRTE:['Calibration','Thermowell inspect','Response time test','Drift check'],
    TRFL:['Calibration','Electrode cleaning','Upstream check','Density correction'],
    TRLE:['Calibration','Float inspect','Condensate drain','Zero check'],
    SWPS:['Setpoint verification','Contact check','Proof test','Seal integrity'],
    SWTS:['Trip point test','Contact resistance','Calibration'],
    SWGS:['Bump test','Calibration','Sensor replacement','Zero check','Alarm test'],
    SWFS:['Functional test','Lens cleaning','Sensitivity check','Wiring inspect'],
    BRMV:['Contact resistance','Trip time test','Insulation test','Lubrication','Thermography'],
    BRLV:['Trip test','Contact check','Thermography','Insulation resistance'],
    BRTR:['Oil sampling','Buchholz test','Winding resistance','IR thermography','Tap changer'],
    BRPN:['Thermography','Torque check','Cleaning','Interlock test','Busbar inspect'],
    VACV:['Stroke test','Positioner calibration','Seat leak test','Packing check','I/P calibration'],
    VASV:['Set pressure test','Seat leak test','Body inspect','As-left documentation'],
    VAON:['Stroke test','Limit switch check','Actuator pressure','Seal check']
  };

  private readonly FAIL: Record<EquipmentClass, string[]> = {
    PU:['Seal failure','Bearing wear','Cavitation','Impeller damage','Misalignment'],
    MO:['Bearing failure','Winding fault','Overheating','Insulation breakdown','Phase imbalance'],
    TR:['Drift out of range','Impulse line blockage','Diaphragm failure','Moisture ingress'],
    SW:['False trip','Setpoint drift','Contact welding','Sensor degradation'],
    BR:['Contact wear','Arc flash','Insulation failure','Overheating'],
    VA:['Seat leakage','Actuator failure','Positioner drift','Packing leak']
  };

  private readonly REASONS = [
    'Failure frequency increased','No failures in 3 years — interval extended',
    'New OEM recommendation','RCM analysis outcome',
    'Frequency changed based on operating environment','Criticality re-assessed',
    'Cost optimisation','Regulatory requirement — new SIL','Operator feedback',
    'Insurance audit finding','Post-incident review'
  ];

  private readonly FREQ_MAP: Record<string, string> = {
    'Vibration analysis':'15min','Temperature monitoring':'15min','Continuous vibration':'15min',
    'Lubrication':'monthly','Bump test':'monthly','Stroke test':'monthly',
    'Zero/span calibration':'6-monthly','Calibration':'6-monthly','Alignment check':'6-monthly',
    'Insulation resistance':'annual','Trip test':'annual','Set pressure test':'annual',
    'Sensor replacement':'2-year',
  };

  private readonly INT_MAP: Record<string, number | null> = {
    '15min':null,'monthly':30,'quarterly':90,'6-monthly':180,'annual':365,'2-year':730
  };

  private readonly EBASE: Record<string, number> = {
    PUGN:45,PUHY:62,PUDI:28,PUSK:38,MOSM:18,MOME:55,MOLG:145,
    TRPR:.8,TRTE:.6,TRFL:1.2,TRLE:.9,SWPS:.3,SWTS:.2,SWGS:.4,SWFS:.5,
    BRMV:8,BRLV:4,BRTR:12,BRPN:3,VACV:6,VASV:2,VAON:4
  };

  private readonly EPROFILE: Record<EquipmentClass, Record<string,number>> = {
    PU:{elec:.85,water:.6,cool:.3},
    MO:{elec:1.0,fuel:.2,cool:.25},
    TR:{elec:.15,gas:.05},
    SW:{elec:.1},
    BR:{elec:.95,cool:.15},
    VA:{elec:.2,gas:.1,heat:.3}
  };

  private readonly SEASON = [1.15,1.10,1.00,0.92,0.88,0.92,1.05,1.10,0.95,0.90,1.02,1.18];

  // ── PUBLIC ACCESSORS ──────────────────────────────────────────
  get assets(): Asset[] {
    if (!this._assets) this._assets = this.generateAssets();
    return this._assets;
  }

  get workOrders(): WorkOrder[] {
    if (!this._workOrders) this._workOrders = this.generateWorkOrders();
    return this._workOrders;
  }

  get strategies(): Strategy[] {
    if (!this._strategies) this._strategies = this.generateStrategies();
    return this._strategies;
  }

  get auditRecords(): AuditRecord[] {
    if (!this._auditRecords) this._auditRecords = this.generateAudit();
    return this._auditRecords;
  }

  get sensorReadings(): SensorReading[] {
    if (!this._sensorReadings) this._sensorReadings = this.generateSensor();
    return this._sensorReadings;
  }

  get energyMonthly(): EnergyMonthly[] {
    if (!this._energyMonthly) this._energyMonthly = this.generateEnergy();
    return this._energyMonthly;
  }

  get flocNodes(): FlocNode[] {
    if (!this._flocNodes) this._flocNodes = this.buildFlocNodes();
    return this._flocNodes;
  }

  // ── ASSET GENERATION ─────────────────────────────────────────
  private generateAssets(): Asset[] {
    const r1 = mkRng(42);
    const assets: Asset[] = [];
    let n = 1;
    for (const [sc, info] of Object.entries(this.SC)) {
      const count = this.COUNTS[sc] ?? 5;
      for (let i = 1; i <= count; i++) {
        const rawCrit = ri(r1, 1, 5);
        const crit = rawCrit < 3 ? ri(r1, 1, 3) : ri(r1, 4, 5);
        const critBounded = Math.min(5, Math.max(1, crit)) as 1|2|3|4|5;
        assets.push({
          asset_id:        `CE-${sc}-${String(i).padStart(3,'0')}`,
          equipment_num:   `EQ-${String(n).padStart(5,'0')}`,
          floc:            this.SC_AREA[sc] ?? 'CE-PL01-PR',
          sub_class:       sc,
          class:           info.cls,
          description:     `${info.name} #${String(i).padStart(3,'0')}`,
          manufacturer:    rc(r1, this.MFR[info.cls]),
          model:           `MDL-${Math.floor(r1()*9000+1000)}`,
          install_date:    `${2019+Math.floor(r1()*5)}-${String(ri(r1,1,12)).padStart(2,'0')}-${String(ri(r1,1,28)).padStart(2,'0')}`,
          criticality:     critBounded,
          status:          rc(r1, ['Active','Active','Active','Standby','Decommissioned'] as AssetStatus[]),
          operating_hours: ri(r1, 2000, 40000)
        });
        n++;
      }
    }
    return assets;
  }

  // ── WORK ORDER GENERATION ─────────────────────────────────────
  private generateWorkOrders(): WorkOrder[] {
    const r2 = mkRng(99);
    const WO_TYPES: WoType[] = ['PM','CM','PdM','Inspection','Modification'];
    const PRIS: WoPriority[] = ['Critical','High','Medium','Low'];
    const WO_STAT: WoStatus[] = ['Completed','Completed','Completed','Closed','In Progress','Planned','Cancelled'];
    const wos: WorkOrder[] = [];
    let wo = 1;
    for (const a of this.assets) {
      const num = Math.max(2, a.criticality * 3 + ri(r2, 0, 2));
      for (let k = 0; k < num; k++) {
        const wtype = rc(r2, WO_TYPES);
        const pri: WoPriority = a.criticality >= 4
          ? rc(r2, ['Critical','High','Medium'] as WoPriority[])
          : rc(r2, PRIS);
        const m = ri(r2, 1, 12), d = ri(r2, 1, 28);
        const pDate = `2024-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const stat = rc(r2, WO_STAT);
        const dur = Math.round((r2() * 7.5 + 0.5) * 100) / 100;
        wos.push({
          wo_number:        `WO-${String(wo).padStart(6,'0')}`,
          asset_id:         a.asset_id,
          floc:             a.floc,
          wo_type:          wtype,
          priority:         pri,
          task_description: rc(r2, this.TASKS[a.sub_class] ?? ['Inspection']),
          failure_mode:     wtype === 'CM' ? rc(r2, this.FAIL[a.class]) : null,
          planned_date:     pDate,
          status:           stat,
          technician_name:  rc(r2, this.TECHS),
          duration_h:       (stat === 'Completed' || stat === 'Closed') ? dur : null,
          cost_usd:         (stat === 'Completed' || stat === 'Closed')
                              ? Math.round(dur * ri(r2, 80, 250) * 100) / 100 : null
        });
        wo++;
      }
    }
    return wos;
  }

  // ── STRATEGY GENERATION ───────────────────────────────────────
  private generateStrategies(): Strategy[] {
    const r2 = mkRng(99);
    const RCM_TYPES: RcmType[] = ['Time-based','Condition-based','Predictive','Failure-finding'];
    const strats: Strategy[] = [];
    for (const [sc, info] of Object.entries(this.SC)) {
      for (const task of (this.TASKS[sc] ?? [])) {
        const freq = this.FREQ_MAP[task] ?? 'quarterly';
        strats.push({
          strategy_id:    `STR-${sc}-${task.substring(0,4).toUpperCase().replace(/ /g,'')}`,
          sub_class:      sc,
          class:          info.cls,
          task_name:      task,
          frequency:      freq,
          interval_days:  this.INT_MAP[freq] ?? 90,
          rcm_type:       rc(r2, RCM_TYPES),
          skill_required: rc(r2, ['Mechanical','Electrical','Instrument','Reliability']),
          est_duration_h: Math.round((r2() * 3.75 + 0.25) * 100) / 100,
          version:        1,
          created_by:     rc(r2, this.PLANNERS)
        });
      }
    }
    return strats;
  }

  // ── AUDIT GENERATION ─────────────────────────────────────────
  private generateAudit(): AuditRecord[] {
    const r3 = mkRng(77);
    const AFIELDS: [string, string[]][] = [
      ['frequency',['monthly','quarterly','6-monthly','annual']],
      ['interval_days',['30','60','90','180','365']],
      ['rcm_type',['Time-based','Condition-based','Predictive','Failure-finding']],
      ['est_duration_h',['0.5','1.0','1.5','2.0','3.0']],
      ['skill_required',['Mechanical','Electrical','Instrument','Reliability']]
    ];
    const scKeys = Object.keys(this.SC);
    const records: AuditRecord[] = [];
    for (let i = 0; i < 406; i++) {
      const sc = rc(r3, scKeys);
      const [field, vals] = rc(r3, AFIELDS);
      const m = ri(r3, 1, 12), d = ri(r3, 1, 28);
      records.push({
        audit_id:       `AUD-${String(i+1).padStart(6,'0')}`,
        strategy_id:    `STR-${sc}-TASK`,
        sub_class:      sc,
        asset_id:       null,
        change_date:    `2024-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')} ${String(ri(r3,6,22)).padStart(2,'0')}:${String(ri(r3,0,59)).padStart(2,'0')}:00`,
        changed_by_name: rc(r3, [...this.TECHS, ...this.PLANNERS]),
        field_changed:  field,
        old_value:      rc(r3, vals),
        new_value:      rc(r3, vals),
        reason:         rc(r3, this.REASONS),
        approved_by:    rc(r3, this.PLANNERS)
      });
    }
    return records.sort((a,b) => b.change_date.localeCompare(a.change_date));
  }

  // ── SENSOR GENERATION ─────────────────────────────────────────
  private generateSensor(): SensorReading[] {
    const r4 = mkRng(55);
    const monAssets = this.assets.filter(a => ['MO','PU','TR'].includes(a.class)).slice(0, 20);
    const readings: SensorReading[] = [];
    for (const a of monAssets) {
      const bt = a.class === 'MO' ? 55 + a.criticality * 3 : a.class === 'PU' ? 45 + a.criticality * 2 : 35 + a.criticality;
      const bv = (a.class === 'MO' || a.class === 'PU') ? 1.2 + a.criticality * 0.3 : null;
      for (let i = 0; i < 10; i++) {
        const spike = r4() < 0.05;
        const m = ri(r4, 1, 12), d = ri(r4, 1, 28), h = ri(r4, 0, 23), mi = ri(r4, 0, 3) * 15;
        const row: SensorReading = {
          asset_id:      a.asset_id,
          ts:            `2024-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')} ${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}:00`,
          temperature_c: Math.round((bt + r4() * 3 - 1.5 + (spike ? 15 : 0)) * 100) / 100,
          alert:         spike
        };
        if (bv !== null) row.vibration_mm_s = Math.round((bv + r4() * .2 - .1 + (spike ? 2.5 : 0)) * 1000) / 1000;
        if (a.class === 'PU') row.pressure_bar = Math.round((8 + a.criticality * 1.5 + r4() * .6 - .3) * 100) / 100;
        if (a.class === 'TR') {
          row.co2_ppm = Math.round((395 + r4() * 25 + (spike ? 800 : 0)) * 10) / 10;
          row.pressure_bar = Math.round((5 + a.criticality * .8 + r4() * .4) * 100) / 100;
        }
        if (a.class === 'MO') row.current_a = Math.round((20 + a.criticality * 5 + r4() * 2 - 1) * 100) / 100;
        readings.push(row);
      }
    }
    return readings.sort((a,b) => b.ts.localeCompare(a.ts));
  }

  // ── ENERGY GENERATION ─────────────────────────────────────────
  private generateEnergy(): EnergyMonthly[] {
    const rE = mkRng(42);
    const records: EnergyMonthly[] = [];
    for (const a of this.assets) {
      const base = (this.EBASE[a.sub_class] ?? 5) * (0.8 + a.criticality * 0.08);
      const prof = this.EPROFILE[a.class] ?? { elec: 0.3 };
      for (let m = 0; m < 12; m++) {
        const s = this.SEASON[m], noise = .85 + rE() * .3;
        const anom = Math.floor(rE() * 3), spike = Math.floor(rE() * 1.5);
        const elec  = Math.round(base * (prof['elec']  ?? 0) * s * noise * 30 * 100) / 100;
        const gas   = Math.round(base * (prof['gas']   ?? 0) * s * noise * 30 * 100) / 100;
        const heat  = Math.round(base * (prof['heat']  ?? 0) * (m < 3 || m > 9 ? 1.4 : .6) * noise * 30 * 100) / 100;
        const water = Math.round(base * (prof['water'] ?? 0) * .02 * noise * 30 * 10000) / 10000;
        const cool  = Math.round(base * (prof['cool']  ?? 0) * .015 * (m >= 5 && m <= 8 ? 1.3 : .8) * noise * 30 * 10000) / 10000;
        const fuel  = Math.round(base * (prof['fuel']  ?? 0) * .1 * noise * 30 * 100) / 100;
        const cost  = Math.round((elec*.12 + gas*.08 + heat*.07 + fuel*.95 + water*2.5 + cool*8) * 100) / 100;
        records.push({
          asset_id: a.asset_id, sub_class: a.sub_class, class: a.class, floc: a.floc,
          month: MONTHS[m], electricity_kwh: elec, gas_kwh: gas, heating_kwh: heat,
          water_m3: water, coolant_l: cool, motor_fuel_l: fuel,
          total_cost_usd: cost, anomaly_count: anom, spike_count: spike
        });
      }
    }
    return records;
  }

  // ── FLOC NODES ────────────────────────────────────────────────
  private buildFlocNodes(): FlocNode[] {
    return [
      {id:'CE-PL01',name:'Plant 1 — Crude Processing',parent:null},
      {id:'CE-PL02',name:'Plant 2 — Refinery Unit',parent:null},
      {id:'CE-PL03',name:'Plant 3 — Chemical Synthesis',parent:null},
      {id:'CE-PL04',name:'Plant 4 — Utilities & Offsites',parent:null},
      {id:'CE-PL01-PR',name:'PL01 Process Area',parent:'CE-PL01'},
      {id:'CE-PL01-CO',name:'PL01 Compression',parent:'CE-PL01'},
      {id:'CE-PL01-UT',name:'PL01 Utilities',parent:'CE-PL01'},
      {id:'CE-PL02-PR',name:'PL02 Distillation',parent:'CE-PL02'},
      {id:'CE-PL02-HT',name:'PL02 Heat Exchange',parent:'CE-PL02'},
      {id:'CE-PL02-UT',name:'PL02 Utilities',parent:'CE-PL02'},
      {id:'CE-PL03-RX',name:'PL03 Reactor',parent:'CE-PL03'},
      {id:'CE-PL03-SE',name:'PL03 Separation',parent:'CE-PL03'},
      {id:'CE-PL03-UT',name:'PL03 Utilities',parent:'CE-PL03'},
      {id:'CE-PL04-EL',name:'PL04 Electrical',parent:'CE-PL04'},
      {id:'CE-PL04-WA',name:'PL04 Water Treatment',parent:'CE-PL04'},
      {id:'CE-PL04-FS',name:'PL04 Fire & Safety',parent:'CE-PL04'},
      {id:'CE-PL01-PR-PU',name:'Process Pump Skid',parent:'CE-PL01-PR',class:'PU'},
      {id:'CE-PL01-PR-MO',name:'Process Motor Room',parent:'CE-PL01-PR',class:'MO'},
      {id:'CE-PL01-PR-TR',name:'Instrumentation',parent:'CE-PL01-PR',class:'TR'},
      {id:'CE-PL01-CO-PU',name:'Compressor Pumps',parent:'CE-PL01-CO',class:'PU'},
      {id:'CE-PL01-CO-MO',name:'Compressor Motors',parent:'CE-PL01-CO',class:'MO'},
      {id:'CE-PL01-UT-BR',name:'Electrical Panel',parent:'CE-PL01-UT',class:'BR'},
      {id:'CE-PL02-PR-TR',name:'Distillation Instr.',parent:'CE-PL02-PR',class:'TR'},
      {id:'CE-PL02-PR-VA',name:'Control Valves',parent:'CE-PL02-PR',class:'VA'},
      {id:'CE-PL02-HT-PU',name:'HX Pumps',parent:'CE-PL02-HT',class:'PU'},
      {id:'CE-PL02-HT-MO',name:'HX Motors',parent:'CE-PL02-HT',class:'MO'},
      {id:'CE-PL02-UT-BR',name:'MCC Room',parent:'CE-PL02-UT',class:'BR'},
      {id:'CE-PL03-RX-TR',name:'Reactor Instr.',parent:'CE-PL03-RX',class:'TR'},
      {id:'CE-PL03-RX-SW',name:'Safety Detectors',parent:'CE-PL03-RX',class:'SW'},
      {id:'CE-PL03-SE-PU',name:'Separator Pumps',parent:'CE-PL03-SE',class:'PU'},
      {id:'CE-PL03-SE-VA',name:'Separator Valves',parent:'CE-PL03-SE',class:'VA'},
      {id:'CE-PL04-EL-BR',name:'Main Substation',parent:'CE-PL04-EL',class:'BR'},
      {id:'CE-PL04-WA-PU',name:'Water Pumps',parent:'CE-PL04-WA',class:'PU'},
      {id:'CE-PL04-WA-TR',name:'Water Instr.',parent:'CE-PL04-WA',class:'TR'},
      {id:'CE-PL04-FS-SW',name:'Fire & Gas',parent:'CE-PL04-FS',class:'SW'},
      {id:'CE-PL04-FS-VA',name:'Deluge Valves',parent:'CE-PL04-FS',class:'VA'},
    ];
  }

  // ── HELPER: add audit record at runtime ───────────────────────
  addAuditRecord(record: AuditRecord): void {
    if (!this._auditRecords) this._auditRecords = this.generateAudit();
    this._auditRecords.unshift(record);
  }
}
