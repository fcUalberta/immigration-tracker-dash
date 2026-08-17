import React from 'react';
import { 
  useGetCourtBacklog,
  getGetCourtBacklogQueryKey
} from '@workspace/api-client-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Scale, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function TabCourtBacklog() {
  const { data: records, isLoading } = useGetCourtBacklog({
    query: {
      queryKey: getGetCourtBacklogQueryKey()
    }
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <p className="font-mono text-xs">QUERYING TRAC IMMIGRATION DATA...</p>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

  const totalPending = (records || []).reduce((acc, r) => acc + r.pendingCases, 0);
  const avgWait = (records || []).reduce((acc, r) => acc + r.avgWaitYears, 0) / (records?.length || 1);
  
  // Sort for chart: top 15 by pending cases
  const chartData = [...(records || [])]
    .sort((a, b) => b.pendingCases - a.pendingCases)
    .slice(0, 15)
    .map(r => ({
      name: r.jurisdiction.split(',')[0], // simplify name
      pending: r.pendingCases,
      wait: r.avgWaitYears,
      change: r.changeFromPriorYear
    }));

  const dataSource = records?.[0]?.dataSource || 'TRAC Immigration (Syracuse University)';

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-destructive/20 text-destructive text-[10px] font-bold px-2 py-0.5 rounded tracking-widest font-mono">BEYOND OFFICIAL NUMBERS</span>
          </div>
          <h2 className="text-xl font-semibold">Immigration Court & Enforcement Backlog</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            USCIS backlogs are only half the picture. The DOJ's Executive Office for Immigration Review (EOIR) manages defensive asylum and deportation cases with completely separate wait times.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border/60 rounded-lg p-6 shadow-sm flex flex-col justify-center">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <Scale size={16} /> Total Pending Court Cases
          </span>
          <div className="text-4xl font-mono font-bold tracking-tight text-destructive">
            {formatNumber(totalPending)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Nationwide total representing millions of individuals in legal limbo.
          </p>
        </div>

        <div className="bg-card border border-border/60 rounded-lg p-6 shadow-sm flex flex-col justify-center">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
            National Avg Court Wait
          </span>
          <div className="text-4xl font-mono font-bold tracking-tight text-chart-3">
            {avgWait.toFixed(1)} <span className="text-2xl text-muted-foreground">Years</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Time until merit hearing. Some jurisdictions exceed 5 years.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-[400px]">
        {/* Chart */}
        <div className="xl:col-span-2 bg-card border border-border/60 rounded-lg p-5 flex flex-col gap-4 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Top 15 Jurisdictions by Backlog Volume
          </h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11} 
                  tickMargin={10} 
                  angle={-45} 
                  textAnchor="end" 
                  height={60} 
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11} 
                  tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} 
                />
                <Tooltip 
                  cursor={{fill: 'hsl(var(--muted)/0.4)'}}
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }}
                  itemStyle={{ fontFamily: 'var(--app-font-mono)' }}
                  formatter={(value: number, name: string) => [
                    name === 'pending' ? formatNumber(value) : value, 
                    name === 'pending' ? 'Pending Cases' : 'Wait (Years)'
                  ]}
                />
                <Bar dataKey="pending" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="hsl(var(--destructive))" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border/60 rounded-lg p-5 flex flex-col gap-4 shadow-sm overflow-hidden flex-1">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            All Jurisdictions
          </h3>
          <div className="overflow-auto max-h-[400px] border border-border/50 rounded-md">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 sticky top-0 backdrop-blur-md z-10">
                <tr>
                  <th className="px-3 py-2 font-semibold">Court</th>
                  <th className="px-3 py-2 font-semibold text-right">Pending</th>
                  <th className="px-3 py-2 font-semibold text-right">YoY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 font-mono text-xs">
                {(records || []).sort((a, b) => b.pendingCases - a.pendingCases).map((record) => (
                  <tr key={record.jurisdiction} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 font-sans font-medium text-foreground">
                      {record.jurisdiction.split(',')[0]}
                      <div className="text-[10px] text-muted-foreground">{record.state}</div>
                    </td>
                    <td className="px-3 py-2 text-right">{formatNumber(record.pendingCases)}</td>
                    <td className="px-3 py-2 text-right">
                      {record.changeFromPriorYear > 0 ? (
                        <span className="text-destructive flex items-center justify-end"><ArrowUpRight size={12}/> {record.changeFromPriorYear}%</span>
                      ) : (
                        <span className="text-chart-2 flex items-center justify-end"><ArrowDownRight size={12}/> {Math.abs(record.changeFromPriorYear)}%</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="text-xs font-mono text-muted-foreground text-right pt-4 border-t border-border">
        SOURCE: {dataSource}
      </div>
    </div>
  );
}
