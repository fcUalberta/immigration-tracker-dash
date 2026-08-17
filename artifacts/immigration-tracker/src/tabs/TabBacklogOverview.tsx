import { useState } from 'react';
import { 
  useGetBacklogSummary, 
  useGetBacklogOverview, 
  GetBacklogOverviewFormType,
  getGetBacklogSummaryQueryKey,
  getGetBacklogOverviewQueryKey
} from '@workspace/api-client-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Minus, AlertCircle, Activity } from 'lucide-react';

const formTypes = ['ALL', 'I-765', 'I-130', 'I-140', 'I-485', 'I-526', 'I-131', 'I-751', 'I-90'];

export default function TabBacklogOverview() {
  const [selectedForm, setSelectedForm] = useState<string>('ALL');

  const { data: summary, isLoading: isLoadingSummary } = useGetBacklogSummary({
    query: {
      queryKey: getGetBacklogSummaryQueryKey()
    }
  });

  const overviewParams = selectedForm === 'ALL' ? {} : { formType: selectedForm as GetBacklogOverviewFormType };
  const { data: records, isLoading: isLoadingRecords } = useGetBacklogOverview(overviewParams, {
    query: {
      queryKey: getGetBacklogOverviewQueryKey(overviewParams)
    }
  });

  const isLoading = isLoadingSummary || isLoadingRecords;

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);
  
  // Dedupe to latest quarter per form type
  const latestByForm = Object.values(
    (records || []).reduce<Record<string, typeof records[0]>>((acc, r) => {
      const key = r.formType;
      if (!acc[key] || r.fiscalYear > acc[key].fiscalYear || (r.fiscalYear === acc[key].fiscalYear && r.quarter > acc[key].quarter)) {
        acc[key] = r;
      }
      return acc;
    }, {})
  );

  // Top 10 forms by pending count for the chart (horizontal grouped bars)
  const chartData = [...latestByForm]
    .sort((a, b) => b.pendingCount - a.pendingCount)
    .slice(0, 10)
    .map(r => ({
      name: r.formType,
      Pending: r.pendingCount,
      Completions: r.completionsLastQuarter,
    }));

  const dataSource = records?.[0]?.dataSource || summary?.lastUpdated || 'USCIS';

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <p className="font-mono text-xs">AGGREGATING DATA...</p>
        </div>
      </div>
    );
  }

  // Aggregate stats based on selection
  let pendingCount = summary?.totalPendingAllForms || 0;
  let completionsCount = summary?.totalCompletionsLastQuarter || 0;
  let trendPct = summary?.overallTrendPct || 0;
  let trendDirection = summary?.overallTrend || 'flat';

  if (selectedForm !== 'ALL' && records && records.length > 0) {
    pendingCount = records[0].pendingCount;
    completionsCount = records[0].completionsLastQuarter;
    trendPct = records[0].netChangePct;
    trendDirection = records[0].trend;
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Backlog Overview</h2>
          <Select value={selectedForm} onValueChange={setSelectedForm}>
            <SelectTrigger className="w-[180px] bg-card/50 border-border">
              <SelectValue placeholder="Select Form Type" />
            </SelectTrigger>
            <SelectContent>
              {formTypes.map(f => (
                <SelectItem key={f} value={f}>{f === 'ALL' ? 'All Forms' : f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs font-mono text-muted-foreground bg-muted/50 px-3 py-1 rounded">
          Q: {summary?.quarterLabel || 'Latest'}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border/60 rounded-lg p-5 flex flex-col gap-1 shadow-sm">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Pending Cases</span>
          <div className="text-3xl font-mono font-semibold tracking-tight">
            {formatNumber(pendingCount)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-sm font-medium">
            {trendDirection === 'up' ? (
              <span className="text-destructive flex items-center gap-1"><ArrowUpRight size={16}/> Up {trendPct}% vs prior Q</span>
            ) : trendDirection === 'down' ? (
              <span className="text-chart-2 flex items-center gap-1"><ArrowDownRight size={16}/> Down {Math.abs(trendPct)}% vs prior Q</span>
            ) : (
              <span className="text-muted-foreground flex items-center gap-1"><Minus size={16}/> Flat</span>
            )}
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-lg p-5 flex flex-col gap-1 shadow-sm">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Completions Last Quarter</span>
          <div className="text-3xl font-mono font-semibold tracking-tight text-primary">
            {formatNumber(completionsCount)}
          </div>
          <div className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
            <Activity size={14} className="opacity-70"/> 
            Throughput metric
          </div>
        </div>

        {selectedForm === 'ALL' && (
          <div className="bg-card border border-border/60 rounded-lg p-5 flex flex-col gap-1 shadow-sm">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Avg Wait Time</span>
            <div className="text-3xl font-mono font-semibold tracking-tight">
              {summary?.avgWaitMonths} <span className="text-lg text-muted-foreground">mos</span>
            </div>
            <div className="text-sm text-muted-foreground mt-2 flex items-center gap-1 text-chart-3">
              <AlertCircle size={14}/> {summary?.formsWithGrowingBacklog} forms with growing backlog
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
        {/* Chart — horizontal grouped bars, top 10 by pending */}
        <div className="bg-card border border-border/60 rounded-lg p-5 flex flex-col gap-4 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Top 10 Forms — Pending vs Completions
          </h3>
          <div style={{ height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                barCategoryGap="25%"
                barGap={3}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  width={52}
                  tickMargin={6}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }}
                  itemStyle={{ fontFamily: 'var(--app-font-mono)', fontSize: 12 }}
                  formatter={(value: number, name: string) => [formatNumber(value), name]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="Pending" fill="hsl(var(--muted-foreground) / 0.45)" radius={[0, 3, 3, 0]} />
                <Bar dataKey="Completions" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border/60 rounded-lg p-5 flex flex-col gap-4 shadow-sm overflow-hidden flex-1">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Form Breakdown</h3>
          <div className="overflow-auto max-h-[350px] border border-border rounded-md">
            <table className="w-full text-sm text-left relative">
              <thead className="text-xs text-muted-foreground bg-muted/50 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-4 py-3 font-semibold">Form</th>
                  <th className="px-4 py-3 font-semibold text-right">Pending</th>
                  <th className="px-4 py-3 font-semibold text-right">Completions (Q)</th>
                  <th className="px-4 py-3 font-semibold text-right">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {latestByForm.map((record) => (
                  <tr key={`${record.formType}-${record.fiscalYear}-${record.quarter}`} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {record.formType}
                      <div className="text-xs text-muted-foreground font-normal truncate max-w-[150px]" title={record.formName}>
                        {record.formName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{formatNumber(record.pendingCount)}</td>
                    <td className="px-4 py-3 text-right font-mono text-primary">{formatNumber(record.completionsLastQuarter)}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {record.trend === 'up' ? (
                        <span className="text-destructive flex items-center justify-end gap-1"><ArrowUpRight size={14}/> {record.netChangePct}%</span>
                      ) : record.trend === 'down' ? (
                        <span className="text-chart-2 flex items-center justify-end gap-1"><ArrowDownRight size={14}/> {Math.abs(record.netChangePct)}%</span>
                      ) : (
                        <span className="text-muted-foreground flex items-center justify-end gap-1"><Minus size={14}/> 0%</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(!records || records.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="text-xs font-mono text-muted-foreground text-right border-t border-border pt-4">
        SOURCE: {dataSource}
      </div>
    </div>
  );
}
