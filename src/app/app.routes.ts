import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Dashboard — Cordant Energy'
  },
  {
    path: 'assets',
    loadComponent: () => import('./features/assets/assets.component').then(m => m.AssetsComponent),
    title: 'Asset Register — Cordant Energy'
  },
  {
    path: 'strategies',
    loadComponent: () => import('./features/strategies/strategies.component').then(m => m.StrategiesComponent),
    title: 'Strategy Library — Cordant Energy'
  },
  {
    path: 'work-orders',
    loadComponent: () => import('./features/work-orders/work-orders.component').then(m => m.WorkOrdersComponent),
    title: 'Work Orders — Cordant Energy'
  },
  {
    path: 'sensor',
    loadComponent: () => import('./features/sensor/sensor.component').then(m => m.SensorComponent),
    title: 'Sensor Feed — Cordant Energy'
  },
  {
    path: 'audit',
    loadComponent: () => import('./features/audit/audit.component').then(m => m.AuditComponent),
    title: 'Audit Trail — Cordant Energy'
  },
  {
    path: 'ai',
    loadComponent: () => import('./features/ai-assistant/ai-assistant.component').then(m => m.AiAssistantComponent),
    title: 'AI Assistant — Cordant Energy'
  },
  {
    path: 'floc',
    loadComponent: () => import('./features/floc/floc.component').then(m => m.FlocComponent),
    title: 'FLOC Hierarchy — Cordant Energy'
  },
  {
    path: 'ems/consumption',
    loadComponent: () => import('./features/ems-consumption/ems-consumption.component').then(m => m.EmsConsumptionComponent),
    title: 'Energy Consumption — Cordant Energy'
  },
  {
    path: 'ems/optimization',
    loadComponent: () => import('./features/ems-optimization/ems-optimization.component').then(m => m.EmsOptimizationComponent),
    title: 'Energy Optimization — Cordant Energy'
  },
  {
    path: 'ems/forecast',
    loadComponent: () => import('./features/ems-forecast/ems-forecast.component').then(m => m.EmsForecastComponent),
    title: 'Energy Forecast — Cordant Energy'
  },
  {
    path: 'ems/analytics',
    loadComponent: () => import('./features/ems-analytics/ems-analytics.component').then(m => m.EmsAnalyticsComponent),
    title: 'Energy Analytics — Cordant Energy'
  },
  {
    path: 'ems/water',
    loadComponent: () => import('./features/ems-water/ems-water.component').then(m => m.EmsWaterComponent),
    title: 'Water Management — Cordant Energy'
  },
  {
    path: 'ems/overview',
    loadComponent: () => import('./features/ems-overview/ems-overview.component').then(m => m.EmsOverviewComponent),
    title: 'EMS Overview — Cordant Energy'
  },
  {
    path: 'integrations',
    loadComponent: () => import('./features/integrations/integrations.component').then(m => m.IntegrationsComponent),
    title: 'Integrations — Cordant Energy'
  },
  { path: '**', redirectTo: 'dashboard' }
];
