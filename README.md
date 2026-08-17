# 🇺🇸 US Immigration Backlog Tracker

A real-time, Bloomberg-terminal-style dashboard that pulls **live USCIS quarterly data** to track immigration form backlogs, processing times, approval/denial trends, and the visa bulletin — all in one place.

![Overview Tab](screenshots/overview.jpg)

---

## Features

| Tab | What it shows |
|---|---|
| **Backlog Overview** | Total pending cases (11.7M+), completions, avg wait time, top-10 forms horizontal bar chart, full form-breakdown table |
| **Processing Time Estimator** | Per-form processing time estimates with historical comparison |
| **RFE & Approval Scrutiny** | Approval/denial rate trends by form type (I-129, I-140, I-485, etc.), including modeled RFE rates |
| **Visa Bulletin Tracker** | Current priority dates for family and employment-based preference categories |
| **Court & Enforcement Backlog** | Immigration court pending caseload and enforcement metrics |
| **Historical Trend Explorer** | Multi-form line charts across 6+ USCIS fiscal quarters |

---

## Live Data

Data is fetched **directly from USCIS** on server startup and refreshed every 24 hours automatically — no manual updates needed.

**Source:** [USCIS Immigration & Citizenship Data](https://uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data)  
**Quarters loaded:** FY2024 Q1, Q3, Q4 · FY2025 Q1, Q2, Q3 (most recent)  
**Total cases tracked:** 11,718,922 pending (FY2025 Q3)

> **Note:** `egov.uscis.gov` (processing times API) and `travel.state.gov` (visa bulletin) block server-side requests via Cloudflare — those sections use representative static data. All backlog counts and approval/denial rates are live USCIS figures.

---

## Screenshots

### Backlog Overview
![Backlog Overview](screenshots/overview.jpg)
*11.7M+ pending cases across 34 form types. Horizontal grouped bar chart shows top 10 forms by pending volume vs quarterly completions.*

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/ui |
| **Charts** | Recharts |
| **Backend** | Express, TypeScript, esbuild |
| **Data** | USCIS XLSX quarterly reports (downloaded and parsed server-side via `xlsx`) |
| **API contract** | OpenAPI 3.0 → Orval codegen (React Query hooks + Zod schemas) |
| **Package manager** | pnpm workspaces (monorepo) |

---

## Project Structure

```
.
├── artifacts/
│   ├── immigration-tracker/       # React + Vite frontend
│   │   └── src/
│   │       ├── App.tsx
│   │       ├── tabs/
│   │       │   ├── TabBacklogOverview.tsx
│   │       │   ├── TabProcessingTime.tsx
│   │       │   ├── TabRfeTrends.tsx
│   │       │   ├── TabVisaBulletin.tsx
│   │       │   ├── TabCourtBacklog.tsx
│   │       │   └── TabHistorical.tsx
│   │       └── components/
│   └── api-server/                # Express API server
│       └── src/
│           ├── index.ts           # Server entry — startup USCIS fetch + 24h refresh
│           ├── uscis-fetcher.ts   # Downloads & parses USCIS XLSX quarterly reports
│           └── routes/
│               └── backlog.ts     # All /api/backlog/* endpoints
├── lib/
│   ├── api-spec/                  # OpenAPI 3.0 spec (openapi.yaml)
│   ├── api-client-react/          # Orval-generated React Query hooks
│   └── api-zod/                   # Orval-generated Zod schemas
└── pnpm-workspace.yaml
```

---

## API Endpoints

All endpoints are served under `/api/backlog/`.

| Endpoint | Description |
|---|---|
| `GET /api/backlog/summary` | Aggregate totals — pending cases, completions, trend, latest quarter label |
| `GET /api/backlog/overview` | Per-form breakdown for the latest quarter (filterable by `formType`) |
| `GET /api/backlog/rfe-trends` | Approval/denial/RFE rates by quarter for a given `formType` |
| `GET /api/backlog/historical` | Multi-form trend series across quarters (`metric`, `startYear`, `endYear`) |
| `GET /api/backlog/processing-times` | Processing time estimates per form sub-type |
| `GET /api/backlog/visa-bulletin` | Current visa bulletin priority dates |
| `GET /api/backlog/court` | Immigration court backlog data |

---

## How USCIS Data Is Fetched

`artifacts/api-server/src/uscis-fetcher.ts` downloads Excel (XLSX) files from:

```
https://uscis.gov/sites/default/files/document/data/quarterly_all_forms_fy{yr}_q{q}.xlsx
```

All quarters are fetched concurrently via `Promise.allSettled` — a 404 for a missing quarter is silently skipped. Records are cached in memory and served immediately on every request.

**Auto-refresh:** `setInterval(() => refreshUSCISData(), 24 * 60 * 60 * 1000)` in `index.ts` keeps data current without a restart.

---

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+

### Install & run

```bash
# Install all workspace dependencies
pnpm install

# Start the API server (port 8080)
pnpm --filter @workspace/api-server run dev

# In a separate terminal, start the frontend (port auto-assigned)
pnpm --filter @workspace/immigration-tracker run dev
```

The frontend proxies `/api/*` requests to the Express server automatically (configured in `vite.config.ts`).

---

## Data Sources

- **USCIS Quarterly Reports** — [uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data](https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data)
- **Visa Bulletin** — [travel.state.gov](https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html) (static representative data — Cloudflare blocks server-side access)
- **Immigration Court** — [TRAC Immigration](https://trac.syr.edu/immigration/) (static representative data — no public API)

---

## License

MIT
