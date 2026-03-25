// ── ASSET MODELS ────────────────────────────────────────────────
export type EquipmentClass = 'PU' | 'MO' | 'TR' | 'SW' | 'BR' | 'VA';
export type AssetStatus    = 'Active' | 'Standby' | 'Decommissioned';
export type WoType         = 'PM' | 'CM' | 'PdM' | 'Inspection' | 'Modification';
export type WoPriority     = 'Critical' | 'High' | 'Medium' | 'Low';
export type WoStatus       = 'Completed' | 'Closed' | 'In Progress' | 'Planned' | 'Cancelled';
export type RcmType        = 'Time-based' | 'Condition-based' | 'Predictive' | 'Failure-finding';

export interface Asset {
  asset_id:        string;
  equipment_num:   string;
  floc:            string;
  sub_class:       string;
  class:           EquipmentClass;
  description:     string;
  manufacturer:    string;
  model:           string;
  install_date:    string;
  criticality:     1 | 2 | 3 | 4 | 5;
  status:          AssetStatus;
  operating_hours: number;
}

export interface SubclassDef {
  cls:  EquipmentClass;
  name: string;
}

// ── WORK ORDER MODELS ────────────────────────────────────────────
export interface WorkOrder {
  wo_number:        string;
  asset_id:         string;
  floc:             string;
  wo_type:          WoType;
  priority:         WoPriority;
  task_description: string;
  failure_mode:     string | null;
  planned_date:     string;
  status:           WoStatus;
  technician_name:  string;
  duration_h:       number | null;
  cost_usd:         number | null;
}

// ── STRATEGY MODELS ──────────────────────────────────────────────
export interface Strategy {
  strategy_id:    string;
  sub_class:      string;
  class:          EquipmentClass;
  task_name:      string;
  frequency:      string;
  interval_days:  number | null;
  rcm_type:       RcmType;
  skill_required: string;
  est_duration_h: number;
  version:        number;
  created_by:     string;
}

// ── AUDIT MODELS ─────────────────────────────────────────────────
export interface AuditRecord {
  audit_id:       string;
  strategy_id:    string;
  sub_class:      string;
  asset_id:       string | null;
  change_date:    string;
  changed_by_name: string;
  field_changed:  string;
  old_value:      string;
  new_value:      string;
  reason:         string;
  approved_by:    string;
}

// ── SENSOR MODELS ────────────────────────────────────────────────
export interface SensorReading {
  asset_id:         string;
  ts:               string;
  temperature_c:    number;
  alert:            boolean;
  vibration_mm_s?:  number;
  pressure_bar?:    number;
  co2_ppm?:         number;
  current_a?:       number;
}

// ── ENERGY MODELS ────────────────────────────────────────────────
export interface EnergyMonthly {
  asset_id:         string;
  sub_class:        string;
  class:            EquipmentClass;
  floc:             string;
  month:            string;
  electricity_kwh:  number;
  gas_kwh:          number;
  heating_kwh:      number;
  water_m3:         number;
  coolant_l:        number;
  motor_fuel_l:     number;
  total_cost_usd:   number;
  anomaly_count:    number;
  spike_count:      number;
}

// ── FLOC MODELS ──────────────────────────────────────────────────
export interface FlocNode {
  id:     string;
  name:   string;
  parent: string | null;
  class?: EquipmentClass;
}

// ── DASHBOARD FILTER STATE ───────────────────────────────────────
export interface DashboardFilters {
  activeClass: EquipmentClass | null;
  activeCrit:  number | null;
  activeType:  WoType | null;
  woPage:      number;
}

// ── CHART HELPERS ────────────────────────────────────────────────
export interface ChartBar {
  label:  string;
  value:  number;
  color:  string;
  pct?:   number;
}

export interface TimeSeriesPoint {
  month: string;
  value: number;
}

export interface PieSlice {
  label: string;
  value: number;
  color: string;
  pct:   number;
}

// ── EXPORT TYPES ─────────────────────────────────────────────────
export interface ExportColumn {
  key:   string;
  label: string;
  width?: number;
}

export type ExportFormat = 'xlsx' | 'pdf';

// ── CONSTANTS ────────────────────────────────────────────────────
export const CLASS_COLORS: Record<EquipmentClass, string> = {
  PU: '#3498db', MO: '#e74c3c', TR: '#2ecc71',
  SW: '#f5a623', BR: '#9b59b6', VA: '#1abc9c'
};

export const CLASS_NAMES: Record<EquipmentClass, string> = {
  PU: 'Pumps', MO: 'Motors', TR: 'Transmitters',
  SW: 'Switches', BR: 'Breakers', VA: 'Valves'
};

export const CRIT_COLORS: Record<number, string> = {
  1: '#4A5570', 2: '#3498db', 3: '#f5a623', 4: '#e67e22', 5: '#e74c3c'
};

export const WO_COLORS: Record<WoType, string> = {
  PM: '#f5a623', CM: '#3498db', PdM: '#2ecc71',
  Inspection: '#1abc9c', Modification: '#9b59b6'
};

export const WO_FULL_NAMES: Record<WoType, string> = {
  PM: 'Preventive Maint.', CM: 'Corrective Maint.',
  PdM: 'Predictive Maint.', Inspection: 'Inspection',
  Modification: 'Modification'
};

export const MONTHS = [
  '2024-01','2024-02','2024-03','2024-04','2024-05','2024-06',
  '2024-07','2024-08','2024-09','2024-10','2024-11','2024-12'
];

export const MONTH_LABELS = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec'
];

export const FLOC_DESCRIPTIONS: Record<string, string> = {
  'CE-PL01-PR-PU': 'Plant 1 · Process Area · Pump Skid',
  'CE-PL01-CO-PU': 'Plant 1 · Compression · Compressor Pumps',
  'CE-PL02-HT-PU': 'Plant 2 · Heat Exchange · HX Pumps',
  'CE-PL03-SE-PU': 'Plant 3 · Separation · Separator Pumps',
  'CE-PL04-WA-PU': 'Plant 4 · Water Treatment · Water Pumps',
  'CE-PL01-PR-MO': 'Plant 1 · Process Area · Motor Room',
  'CE-PL02-HT-MO': 'Plant 2 · Heat Exchange · HX Motors',
  'CE-PL01-CO-MO': 'Plant 1 · Compression · Compressor Motors',
  'CE-PL01-PR-TR': 'Plant 1 · Process Area · Instrumentation',
  'CE-PL03-RX-TR': 'Plant 3 · Reactor · Instruments',
  'CE-PL02-PR-TR': 'Plant 2 · Distillation · Instruments',
  'CE-PL04-WA-TR': 'Plant 4 · Water Treatment · Instruments',
  'CE-PL03-RX-SW': 'Plant 3 · Reactor · Safety Detectors',
  'CE-PL04-FS-SW': 'Plant 4 · Fire & Safety · Fire/Gas System',
  'CE-PL04-EL-BR': 'Plant 4 · Electrical · Main Substation',
  'CE-PL02-UT-BR': 'Plant 2 · Utilities · MCC Room',
  'CE-PL01-UT-BR': 'Plant 1 · Utilities · Electrical Panel',
  'CE-PL03-UT-BR': 'Plant 3 · Utilities · Electrical Room',
  'CE-PL02-PR-VA': 'Plant 2 · Distillation · Control Valves',
  'CE-PL04-FS-VA': 'Plant 4 · Fire & Safety · Deluge Valves',
  'CE-PL03-SE-VA': 'Plant 3 · Separation · Separator Valves',
};
