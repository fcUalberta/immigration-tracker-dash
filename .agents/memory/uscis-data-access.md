---
name: USCIS Live Data Access
description: How to fetch live USCIS quarterly data; which sources are blocked server-side vs accessible
---

## Rule
USCIS quarterly XLSX reports are directly downloadable server-side. `egov.uscis.gov` and `travel.state.gov` are both Cloudflare Bot Protection blocked from Replit server IPs.

**Why:** Discovered empirically via HTTP HEAD/GET during build. egov.uscis.gov returns Cloudflare block HTML; travel.state.gov same. USCIS static file CDN (uscis.gov/sites/default/files) has no bot protection.

## How to Apply
- XLSX URL pattern: `https://www.uscis.gov/sites/default/files/document/data/quarterly_all_forms_fy{yr}_q{q}.xlsx`
- Available quarters confirmed (others return 404): FY2024 Q1, Q3, Q4 | FY2025 Q1, Q2, Q3 (FY2025 Q3 is most recent as of Aug 2026)
- Sheet name in workbook: `FY{yy}Q{q}_All_Forms` (e.g., `FY25Q3_All_Forms`)
- Column layout (0-indexed): [formType, description, Q_received, Q_approved, Q_denied, Q_completions, pending, processingTime, FYtd_received, FYtd_approved, FYtd_denied, FYtd_completions, FYtd_pending]
- Data rows start at index 5; row 5 is TOTAL (skip). Section headers (Family Based, Employment Based, etc.) have no numeric pending value — skip those.
- Form numbers have footnote digits appended (e.g., "I-76510" = I-765 + footnote 10). Strip with: `/^([A-Z]+-\d{2,3}[A-Z]*)/` regex.
- Fetcher lives at: `artifacts/api-server/src/uscis-fetcher.ts`
- Visa Bulletin (travel.state.gov) and egov processing times → keep as static/representative data.
