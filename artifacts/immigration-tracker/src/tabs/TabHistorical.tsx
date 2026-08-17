import React, { useState } from 'react';
import { 
  useGetHistoricalTrends,
  GetHistoricalTrendsMetric,
  getGetHistoricalTrendsQueryKey
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

const metrics = [
  { value: 'pending_volume', label: 'Pending Volume' },
  { value: 'rfe_rate', label: 'RFE Rate' },
  { value: 'completion_rate', label: 'Completion Rate' },
  { value: 'approval_rate', label: 'Approval Rate' }
];

export default function TabHistorical() {
  const [metric, setMetric] = useState<GetHistoricalTrendsMetric>('pending_volume');
  
  // Note: API allows startYear, endYear, formType, but we keep it simple for the explorer
  // Orval hook handles these params
  const { data: trendData, isLoading } = useGetHistoricalTrends({ metric }, {
    query: {
      queryKey: getGetHistoricalTrendsQueryKey({ metric })
    }
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <p className="font-mono text-xs">LOADING HISTORICAL SERIES...</p>
        </div>
      </div>
    );
  }

  // Transform data for recharts multi-line chart
  // We need an array where each object is a time period (e.g. FY20 Q1), and has keys for each series
  
  const allTimePeriods = new Set<string>();
  const chartDataMap = new Map<string, any>();

  // Collect all unique time periods and populate map
  trendData?.series?.forEach(series => {
    series.dataPoints.forEach(dp => {
      const timeKey = dp.quarterLabel; // e.g. "FY20 Q1"
      allTimePeriods.add(timeKey);
      
      if (!chartDataMap.has(timeKey)) {
        chartDataMap.set(timeKey, { name: timeKey, sortKey: `${dp.fiscalYear}-${dp.quarter}` });
      }
      
      const point = chartDataMap.get(timeKey);
      point[series.formType] = dp.value;
    });
  });

  // Convert map to sorted array
  const chartData = Array.from(chartDataMap.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const colors = [
    'hsl(var(--primary))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--destructive))',
    'hsl(var(--foreground))',
    'hsl(var(--muted-foreground))'
  ];

  const isPercentage = metric.includes('rate');

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Historical Trend Explorer</h2>
          <p className="text-sm text-muted-foreground mt-1">Cross-reference USCIS metrics over multi-year periods.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-card p-2 rounded-lg border border-border shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground px-2 uppercase">Metric:</span>
          <Select value={metric} onValueChange={(val) => setMetric(val as GetHistoricalTrendsMetric)}>
            <SelectTrigger className="w-[200px] border-border bg-background">
              <SelectValue placeholder="Select Metric" />
            </SelectTrigger>
            <SelectContent>
              {metrics.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card border border-border/60 rounded-lg p-6 shadow-sm flex-1 min-h-[500px] flex flex-col">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
          {trendData?.metricLabel || 'Historical Series'}
        </h3>
        
        <div style={{ height: 440 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickMargin={10}
                minTickGap={30}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickFormatter={(val) => isPercentage ? `${val}%` : val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }}
                itemStyle={{ fontFamily: 'var(--app-font-mono)' }}
                formatter={(value: number) => [
                  isPercentage ? `${value}%` : new Intl.NumberFormat('en-US').format(value), 
                  ''
                ]}
              />
              <Legend 
                iconType="circle" 
                wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} 
              />
              
              {trendData?.series?.map((series, idx) => (
                <Line 
                  key={series.formType}
                  type="monotone" 
                  dataKey={series.formType} 
                  name={series.formName || series.formType}
                  stroke={colors[idx % colors.length]} 
                  strokeWidth={2} 
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="text-xs font-mono text-muted-foreground text-right pt-4 border-t border-border">
        SOURCE: {trendData?.dataSource || 'Historical Database'}
      </div>
    </div>
  );
}
