import React, { useState } from 'react';
import { 
  useGetRfeTrends,
  getGetRfeTrendsQueryKey
} from '@workspace/api-client-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { FileSearch, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';

// Display label → USCIS form type used in the API.
// H-1B and L-1 are both filed on I-129; USCIS quarterly reports don't split them further.
const FORM_OPTIONS = [
  { label: 'I-129 (H-1B / L-1 / O-1)', apiFormType: 'I-129' },
  { label: 'I-140 — EB Immigrant Petition', apiFormType: 'I-140' },
  { label: 'I-485 — Adjustment of Status', apiFormType: 'I-485' },
  { label: 'I-130 — Family Petition', apiFormType: 'I-130' },
  { label: 'I-526E — EB-5 Regional Center', apiFormType: 'I-526E' },
  { label: 'I-589 — Asylum Application', apiFormType: 'I-589' },
  { label: 'I-918 — U Visa', apiFormType: 'I-918' },
  { label: 'I-765 — Employment Authorization', apiFormType: 'I-765' },
];

export default function TabRfeTrends() {
  const [selectedOption, setSelectedOption] = useState(FORM_OPTIONS[0]);

  const { data: records, isLoading } = useGetRfeTrends(
    { formType: selectedOption.apiFormType },
    {
      query: {
        queryKey: getGetRfeTrendsQueryKey({ formType: selectedOption.apiFormType }),
      },
    }
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <p className="font-mono text-xs">LOADING SCRUTINY METRICS...</p>
        </div>
      </div>
    );
  }

  // API returns rates as decimals (0.131 = 13.1%) — convert to percentage for display
  const chartData = (records || []).map(r => ({
    name: r.quarterLabel,
    rfeRate:      r.rfeRate      != null ? Math.round(r.rfeRate * 1000) / 10      : null,
    approvalRate: r.approvalRate != null ? Math.round(r.approvalRate * 1000) / 10 : null,
    denialRate:   r.denialRate   != null ? Math.round(r.denialRate * 1000) / 10   : null,
    record: r,
  }));

  const latestChart = chartData[chartData.length - 1];
  const prevChart   = chartData[chartData.length - 2];
  const rfeTrendDir =
    latestChart && prevChart && latestChart.rfeRate != null && prevChart.rfeRate != null
      ? latestChart.rfeRate > prevChart.rfeRate ? 'up' : 'down'
      : 'flat';

  const dataSource = records?.[0]?.dataSource || 'USCIS Employer Data Hub';
  const hasData = chartData.length > 0;

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">RFE &amp; Approval Scrutiny</h2>
          <Select
            value={selectedOption.apiFormType}
            onValueChange={(val) => {
              const opt = FORM_OPTIONS.find(o => o.apiFormType === val);
              if (opt) setSelectedOption(opt);
            }}
          >
            <SelectTrigger className="w-[260px] bg-card/50 border-border">
              <SelectValue placeholder="Select Form Type" />
            </SelectTrigger>
            <SelectContent>
              {FORM_OPTIONS.map(o => (
                <SelectItem key={o.apiFormType} value={o.apiFormType}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!hasData && (
        <div className="flex-1 flex items-center justify-center min-h-[300px] text-muted-foreground font-mono text-sm">
          NO DATA AVAILABLE FOR THIS FORM TYPE
        </div>
      )}

      {hasData && latestChart && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border/60 rounded-lg p-5 flex flex-col gap-1 shadow-sm">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <FileSearch size={16} /> Latest RFE Rate
            </span>
            <div className="text-3xl font-mono font-semibold tracking-tight text-chart-3 mt-1">
              {latestChart.rfeRate != null ? `${latestChart.rfeRate}%` : 'N/A'}
            </div>
            <div className="text-sm mt-2 flex items-center gap-1 font-medium">
              {rfeTrendDir === 'up' ? (
                <span className="text-destructive">Increased vs prior quarter</span>
              ) : (
                <span className="text-chart-2">Decreased vs prior quarter</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Modeled — not in USCIS quarterly report</div>
          </div>

          <div className="bg-card border border-border/60 rounded-lg p-5 flex flex-col gap-1 shadow-sm">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 size={16} className="text-chart-2" /> Approval Rate
            </span>
            <div className="text-3xl font-mono font-semibold tracking-tight mt-1">
              {latestChart.approvalRate != null ? `${latestChart.approvalRate}%` : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground mt-2">Live from USCIS quarterly data</div>
          </div>

          <div className="bg-card border border-border/60 rounded-lg p-5 flex flex-col gap-1 shadow-sm">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <XCircle size={16} className="text-destructive" /> Denial Rate
            </span>
            <div className="text-3xl font-mono font-semibold tracking-tight mt-1">
              {latestChart.denialRate != null ? `${latestChart.denialRate}%` : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground mt-2">Live from USCIS quarterly data</div>
          </div>
        </div>
      )}

      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RFE Rate chart */}
          <div className="bg-card border border-border/60 rounded-lg p-5 flex flex-col gap-4 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={16} /> RFE Rate Trend
              <span className="text-xs normal-case font-normal">(modeled)</span>
            </h3>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickMargin={8} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }}
                    itemStyle={{ fontFamily: 'var(--app-font-mono)' }}
                    formatter={(value: number) => [`${value}%`, 'RFE Rate']}
                  />
                  <Line
                    type="monotone"
                    dataKey="rfeRate"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={3}
                    dot={{ r: 4, fill: 'hsl(var(--card))', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--chart-3))', stroke: 'none' }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Approval/Denial chart */}
          <div className="bg-card border border-border/60 rounded-lg p-5 flex flex-col gap-4 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Approval vs Denial Trend
              <span className="text-xs normal-case font-normal ml-2">(live USCIS data)</span>
            </h3>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickMargin={8} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }}
                    itemStyle={{ fontFamily: 'var(--app-font-mono)' }}
                    formatter={(value: number, name: string) => [
                      `${value}%`,
                      name === 'approvalRate' ? 'Approval' : 'Denial',
                    ]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="approvalRate"
                    name="Approval Rate"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="denialRate"
                    name="Denial Rate"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs font-mono text-muted-foreground text-right pt-4 border-t border-border">
        SOURCE: {dataSource}
      </div>
    </div>
  );
}
