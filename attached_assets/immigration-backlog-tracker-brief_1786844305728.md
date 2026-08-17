# US Immigration Backlog Tracker — Project Brief

## Use Case

A Streamlit dashboard focused on **US immigration processing data** — pending case volumes,
realistic wait-time estimates, RFE/approval trends, visa bulletin movement, and court backlogs.
Positioned as a "processing reality check" that goes beyond the optimistic ranges shown on
official government sites, by calculating estimated waits from actual recent throughput.

Scope decision: **US-only for v1.** Canada (IRCC) data uses a different schema, form
categories, and fiscal calendar — combining both from day one adds engineering overhead
before the US-only version is proven useful. Canada can be added as a v2 module once the
US data pipeline and UI patterns are solid.

## Tab Structure

### Tab 1 — Backlog Overview (build first)
- User picks a form type: I-765 (work permit), I-130 (family petition), I-140 (employment-based),
  I-485 (adjustment of status), I-526 (investor visa), etc.
- Shows: current pending count, latest quarter's completions, net change trend
- Headline metric: "Pending cases up/down X% vs. last quarter"

### Tab 2 — Processing Time Estimator (build first)
- Form type + service center (if data granularity allows) → estimated wait time
- Calculation: pending volume ÷ average quarterly completion rate (transparent methodology,
  shown to the user — this is the differentiator vs. USCIS's own optimistic published ranges)

### Tab 3 — RFE & Approval Trends
- Request for Evidence (RFE) rate by form type over time
- Approval/denial rate trend where data supports it

### Tab 4 — Visa Bulletin Tracker
- Priority date movement by employment-based category (EB-1, EB-2, EB-3)
- Broken out by country of chargeability (India/China backlogs are distinct and severe —
  worth showing separately, not blended into an "all countries" average)
- Month-over-month movement chart (days/months advanced)

### Tab 5 — Court & Enforcement Backlog
- Immigration court case backlog by jurisdiction (TRAC data)
- Framed as a "beyond the official numbers" layer, distinct from USCIS-only tabs

### Tab 6 — Historical Trend Explorer
- Free-form chart builder: pick any metric (pending volume, RFE rate, completion rate)
  across form types and years
- Demonstrates the depth of the underlying dataset beyond the headline tabs

**Build order:** Tabs 1–2 first (clearest personal utility + differentiation), then 3–4,
then 5–6.

## Data Sources

| Source | What it provides | Access | Notes |
|---|---|---|---|
| **USCIS Immigration & Citizenship Data** | Quarterly XLSX: all form types, pending counts, processing times, RFE rates by fiscal year/quarter | Free, no API key, direct XLSX download | uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data — primary source for Tabs 1–3 |
| **DOS Visa Bulletin** | Priority date movement by employment-based category and country | Free, published monthly | Primary source for Tab 4 |
| **TRAC Immigration** | Court backlogs, asylum decisions, enforcement data (via FOIA litigation) | Free, independent/nonpartisan source | Primary source for Tab 5 — cross-check against official USCIS optimism |
| **Niskanen Center analysis** | Derived backlog trend commentary/metrics | Free, published reports | Reference for validating derived metrics, not a raw data feed |

## Framing / Handling Notes
- This is a politically sensitive, headline-heavy topic area. Stick to **descriptive stats**
  (volumes, processing times, trends) rather than editorializing.
- Cite the source agency directly on every chart/tab so the tool reads as a neutral reference
  utility, not commentary.
- Since this has personal relevance (Canada → Texas move), it's fine to build with that lens,
  but keep the public-facing framing neutral if shared more broadly.

## Open Items to Resolve in Build
- Confirm exact USCIS XLSX file structure/column names per form type (may vary by release)
- Decide refresh cadence (USCIS releases are quarterly — no need for real-time polling)
- Scope the wait-time estimator's methodology precisely before building (pending ÷ throughput
  is the starting formula, but service-center-level granularity may not exist in the public files)
- Canada/IRCC module — deferred to v2, not scoped in this brief
