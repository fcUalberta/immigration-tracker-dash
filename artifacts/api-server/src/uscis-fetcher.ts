/**
 * USCIS Live Data Fetcher
 *
 * Downloads quarterly XLSX reports published by USCIS at:
 *   https://www.uscis.gov/sites/default/files/document/data/quarterly_all_forms_fy{yr}_q{q}.xlsx
 *
 * Available quarters confirmed via HTTP HEAD (others return 404):
 *   FY2024 Q1, Q3, Q4 | FY2025 Q1, Q2, Q3
 */

import * as XLSX from "xlsx";
import { logger } from "./lib/logger";

export interface BacklogRecord {
  formType: string;
  description: string;
  fiscalYear: number;
  quarter: number;
  pendingCount: number;
  completionsLastQuarter: number;
  approvedLastQuarter: number;
  deniedLastQuarter: number;
  processingTimeMonths: number;
}

const QUARTERS: Array<{ fy: number; q: number }> = [
  { fy: 2024, q: 1 },
  { fy: 2024, q: 3 },
  { fy: 2024, q: 4 },
  { fy: 2025, q: 1 },
  { fy: 2025, q: 2 },
  { fy: 2025, q: 3 },
];

// Section header rows that don't represent a form
const SECTION_HEADERS = new Set([
  "Family Based",
  "Employment Based",
  "Humanitarian",
  "Lawful Permanent Residence",
  "Citizenship and Nationality",
  "Other",
  "Supplemental Processing",
  "Legalization/SAW",
  "TOTAL",
]);

function xlsxUrl(fy: number, q: number): string {
  return `https://www.uscis.gov/sites/default/files/document/data/quarterly_all_forms_fy${fy}_q${q}.xlsx`;
}

/**
 * Strip footnote digits appended to USCIS form numbers in their XLSX exports.
 * E.g. "I-76510" → "I-765", "N-40021" → "N-400", "I-5269" → "I-526"
 *
 * Pattern: 1-3 letter prefix, dash, 2-3 digit form number, optional suffix letter(s),
 * then any trailing pure-digit footnote.
 */
function cleanFormType(raw: string): string {
  const m = raw.match(/^([A-Z]+-\d{2,3}[A-Z]*)/);
  return m ? m[1] : raw.replace(/\d+$/, "").trim();
}

function numOrZero(val: unknown): number {
  return typeof val === "number" && isFinite(val) ? Math.round(val) : 0;
}

async function fetchQuarter(fy: number, q: number): Promise<BacklogRecord[]> {
  const url = xlsxUrl(fy, q);
  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; USImmigrationTracker/1.0; +https://replit.com)",
    },
    signal: AbortSignal.timeout(45_000),
  });

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} for FY${fy} Q${q}`);
  }

  const buffer = Buffer.from(await resp.arrayBuffer());
  const wb = XLSX.read(buffer, { type: "buffer" });

  // Main sheet: e.g. "FY25Q2_All_Forms"
  const sheetName =
    wb.SheetNames.find((n) => /_All_Forms/i.test(n)) ?? wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: "",
  });

  const records: BacklogRecord[] = [];

  // Row 0-4 = title/header rows; data starts at row 5
  for (let i = 5; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (!row || !row[0]) continue;

    const rawType = String(row[0]).trim();
    if (!rawType) continue;
    // Stop at table key / footnote rows
    if (
      rawType.startsWith("Table Key") ||
      rawType.startsWith("N/A ") ||
      rawType.startsWith("D ") ||
      rawType.startsWith("H ") ||
      rawType.startsWith("- ")
    )
      continue;

    const formType = cleanFormType(rawType);
    const description = String(row[1]).trim();

    // Skip section category rows
    if (SECTION_HEADERS.has(rawType) || SECTION_HEADERS.has(formType)) continue;
    if (!description) continue;

    // Pending count must be a real number
    const pending = row[6];
    if (typeof pending !== "number") continue;

    records.push({
      formType,
      description,
      fiscalYear: fy,
      quarter: q,
      pendingCount: Math.round(pending),
      completionsLastQuarter: numOrZero(row[5]),
      approvedLastQuarter: numOrZero(row[3]),
      deniedLastQuarter: numOrZero(row[4]),
      processingTimeMonths: typeof row[7] === "number" ? row[7] : 0,
    });
  }

  return records;
}

interface FetcherState {
  records: BacklogRecord[];
  lastFetched: Date | null;
  lastUpdatedLabel: string;
  isFetching: boolean;
  error: string | null;
}

const state: FetcherState = {
  records: [],
  lastFetched: null,
  lastUpdatedLabel: "Loading…",
  isFetching: false,
  error: null,
};

export async function refreshUSCISData(): Promise<void> {
  if (state.isFetching) return;
  state.isFetching = true;
  state.error = null;

  try {
    logger.info("[USCIS] Starting XLSX download for all available quarters…");

    const results = await Promise.allSettled(
      QUARTERS.map(({ fy, q }) => fetchQuarter(fy, q))
    );

    const allRecords: BacklogRecord[] = [];
    let successCount = 0;
    let latestFY = 0;
    let latestQ = 0;

    QUARTERS.forEach(({ fy, q }, i) => {
      const result = results[i];
      if (result.status === "fulfilled") {
        allRecords.push(...result.value);
        successCount++;
        if (fy > latestFY || (fy === latestFY && q > latestQ)) {
          latestFY = fy;
          latestQ = q;
        }
      } else {
        logger.warn(
          `[USCIS] Failed FY${fy} Q${q}: ${(result.reason as Error)?.message}`
        );
      }
    });

    if (successCount === 0) {
      throw new Error("All quarter downloads failed");
    }

    state.records = allRecords;
    state.lastFetched = new Date();
    state.lastUpdatedLabel = `Live USCIS Data · FY${latestFY} Q${latestQ} (${successCount}/${QUARTERS.length} quarters)`;

    logger.info(
      `[USCIS] Loaded ${allRecords.length} records from ${successCount} quarters. Latest: FY${latestFY} Q${latestQ}`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    state.error = msg;
    logger.error(`[USCIS] Refresh failed: ${msg}`);
  } finally {
    state.isFetching = false;
  }
}

export const getRecords = (): BacklogRecord[] => state.records;
export const getLastFetched = (): Date | null => state.lastFetched;
export const getLastUpdatedLabel = (): string => state.lastUpdatedLabel;
export const isDataLoaded = (): boolean => state.records.length > 0;
export const getFetchError = (): string | null => state.error;
