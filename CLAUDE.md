# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # Dev server (ng serve)
npm run build          # Development build
npm run build:prod     # Production build
npm run watch          # Watch mode (dev)
```

No test runner is configured in this project.

## Architecture Overview

**Cordant Energy** — Maintenance & EMS Platform built with Angular 17 standalone components (no NgModules).

### App Shell

- `src/app/app.config.ts` — Bootstrap config (routing + animations)
- `src/app/app.routes.ts` — 16 lazy-loaded feature routes; default redirects to `/dashboard`
- `src/app/layout/layout.component.ts` — Master shell with sticky top navbar and sidebar; all feature pages render inside its `<router-outlet>`

### Core Layer (`src/app/core/`)

| File | Purpose |
|------|---------|
| `models/cordant.models.ts` | All domain types: `Asset`, `WorkOrder`, `Strategy`, `AuditRecord`, `SensorReading`, `EnergyMonthly`, `FlocNode` |
| `services/data.service.ts` | Generates and caches all mock data using seeded RNG (seeds 42, 99, 77, 55). Single source of truth for all feature data. |
| `services/export.service.ts` | XLSX (via `xlsx`) and PDF (via `pdfmake`) export with Cordant branding |
| `services/filter.service.ts` | Global filter state using Angular signals |
| `services/theme.service.ts` | Dark/light theme toggle persisted to `localStorage` |

### Feature Pages (`src/app/features/`)

Each feature is a standalone component loaded lazily. EMS Analytics is a sub-router with 6 child routes (`consumption`, `optimization`, `forecast`, `analytics`, `water`, `overview`).

### Shared Components (`src/app/shared/components/`)

- `kpi-card` — KPI display tile with 6 accent color themes
- `page-header` — Standard header with XLSX/PDF export menu (uses `ExportService`)

## Key Conventions

- **Component prefix:** `ce` (e.g., `<ce-root>`, `<ce-kpi-card>`)
- **Styling:** SCSS with CSS custom properties; dark theme by default, light via `.light-theme` class on `<body>`
- **CSS variables:** `--bg`, `--bg2`, `--card`, `--el`, `--border`, `--bright`, `--t1`, `--t2`, `--t3`, plus semantic colors (amber `#f5a623`, green, red, blue, cyan, purple)
- **Fonts:** IBM Plex Sans (body), IBM Plex Mono (mono), Rajdhani (display headings)
- **Reactivity:** Use Angular signals and `computed()` for local state; `FilterService` uses signals for cross-feature filter state
- **No real backend:** All data is generated in `DataService` — do not add HTTP calls without explicit instruction
- **Material palette:** Amber (primary), Blue (accent), Red (warn)

## TypeScript Config

Strict mode is enabled (`strict: true`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`). Target: ES2022, module resolution: bundler.
