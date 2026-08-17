import React, { useState } from 'react';
import { 
  useGetVisaBulletin,
  getGetVisaBulletinQueryKey
} from '@workspace/api-client-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
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

export default function TabVisaBulletin() {
  const [activeCategory, setActiveCategory] = useState<string>('EB-2');

  const { data: bulletinData, isLoading } = useGetVisaBulletin({
    query: {
      queryKey: getGetVisaBulletinQueryKey()
    }
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <p className="font-mono text-xs">PARSING STATE DEPARTMENT BULLETINS...</p>
        </div>
      </div>
    );
  }

  if (!bulletinData || !bulletinData.categories) {
    return (
      <div className="text-center text-muted-foreground py-10">No Visa Bulletin data available</div>
    );
  }

  const categoryData = bulletinData.categories.find(c => c.category === activeCategory) || bulletinData.categories[0];
  const months = bulletinData.months || [];

  // Transform data for the line chart
  // Chart needs an array of objects where each object represents a month, and has keys for each country's movement
  const chartData = months.map((month, index) => {
    const dataPoint: any = { name: month };
    categoryData.countries.forEach(country => {
      // movementMonths represents days advanced. We plot the cumulative advancement or just the month-over-month.
      // Wait, priority date movement chart usually plots the actual date (converted to years or something) or the wait time.
      // Let's plot the month-over-month movement (days advanced) to show volatility.
      dataPoint[country.country] = country.movementMonths[index] || 0;
    });
    return dataPoint;
  });

  const colors = [
    'hsl(var(--primary))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--destructive))'
  ];

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Visa Bulletin Tracker</h2>
          <p className="text-sm text-muted-foreground mt-1">Final Action Dates & Priority Date Movement</p>
        </div>
        <div className="text-xs font-mono text-muted-foreground bg-muted/50 px-3 py-1 rounded border border-border">
          UPDATED: {bulletinData.lastUpdated}
        </div>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex flex-col flex-1 gap-6">
        <TabsList className="bg-card border border-border h-auto p-1 self-start">
          {bulletinData.categories.map(cat => (
            <TabsTrigger 
              key={cat.category} 
              value={cat.category}
              className="px-6 py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-[450px]">
          {/* Movement Line Chart */}
          <div className="bg-card border border-border/60 rounded-lg p-5 flex flex-col gap-4 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Monthly Movement (Days Advanced)
            </h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} label={{ value: 'Days', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', dy: 20 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }}
                    itemStyle={{ fontFamily: 'var(--app-font-mono)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  {categoryData.countries.map((country, idx) => (
                    <Line 
                      key={country.country}
                      type="monotone" 
                      dataKey={country.country} 
                      name={country.country}
                      stroke={colors[idx % colors.length]} 
                      strokeWidth={2} 
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-card border border-border/60 rounded-lg p-5 flex flex-col gap-4 shadow-sm overflow-hidden flex-1">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Priority Dates ({activeCategory})
            </h3>
            <div className="overflow-auto max-h-[400px] border border-border/50 rounded-md">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Country</th>
                    <th className="px-4 py-3 font-semibold">Latest Date</th>
                    <th className="px-4 py-3 font-semibold text-right">Last MoM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 font-mono">
                  {categoryData.countries.map(country => {
                    const latestDate = country.priorityDates[country.priorityDates.length - 1];
                    const latestMove = country.movementMonths[country.movementMonths.length - 1];
                    const isCurrent = latestDate === 'C' || latestDate === 'Current';
                    
                    return (
                      <tr key={country.country} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-sans font-medium">{country.country}</td>
                        <td className="px-4 py-3">
                          {isCurrent ? (
                            <span className="text-chart-2 bg-chart-2/10 px-2 py-0.5 rounded text-xs font-sans font-bold">CURRENT</span>
                          ) : (
                            latestDate || 'U'
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {latestMove === null ? '-' : latestMove > 0 ? (
                            <span className="text-chart-2">+{latestMove} days</span>
                          ) : latestMove < 0 ? (
                            <span className="text-destructive">{latestMove} days (Retrogressed)</span>
                          ) : (
                            <span className="text-muted-foreground">0 days</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="bg-accent/30 border border-accent rounded p-3 mt-4 text-xs font-mono text-accent-foreground">
              Note: 'C' indicates Current (no backlog for the category). Negative movement indicates retrogression due to quota exhaustion.
            </div>
          </div>
        </div>
      </Tabs>

      <div className="text-xs font-mono text-muted-foreground text-right pt-4 border-t border-border">
        SOURCE: {bulletinData.dataSource || 'US Department of State'}
      </div>
    </div>
  );
}
