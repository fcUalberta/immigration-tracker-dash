import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Clock, TrendingUp, Globe, Scale, History, Database } from 'lucide-react';
import TabBacklogOverview from '../tabs/TabBacklogOverview';
import TabProcessingTime from '../tabs/TabProcessingTime';
import TabRfeTrends from '../tabs/TabRfeTrends';
import TabVisaBulletin from '../tabs/TabVisaBulletin';
import TabCourtBacklog from '../tabs/TabCourtBacklog';
import TabHistorical from '../tabs/TabHistorical';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
              <Activity size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight leading-none text-card-foreground">
                US Immigration Backlog Tracker
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                TERMINAL / <span className="text-primary/80">REAL-TIME INTELLIGENCE</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chart-2 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-chart-2"></span>
              </span>
              SYSTEM OPERATIONAL
            </div>
            <div className="h-4 w-px bg-border"></div>
            <div>USCIS & TRAC DATA</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-card/50 border border-border/50 h-auto p-1 text-muted-foreground flex-wrap justify-start sm:flex-nowrap sm:overflow-x-auto sm:justify-start">
              <TabsTrigger value="overview" className="gap-2 py-2 px-4 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all">
                <Database size={15} /> Overview
              </TabsTrigger>
              <TabsTrigger value="processing" className="gap-2 py-2 px-4 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all">
                <Clock size={15} /> Processing Time
              </TabsTrigger>
              <TabsTrigger value="rfe" className="gap-2 py-2 px-4 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all">
                <TrendingUp size={15} /> RFE Trends
              </TabsTrigger>
              <TabsTrigger value="visa" className="gap-2 py-2 px-4 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all">
                <Globe size={15} /> Visa Bulletin
              </TabsTrigger>
              <TabsTrigger value="court" className="gap-2 py-2 px-4 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all">
                <Scale size={15} /> Court Backlog
              </TabsTrigger>
              <TabsTrigger value="historical" className="gap-2 py-2 px-4 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all">
                <History size={15} /> Historical
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 relative">
            <TabsContent value="overview" className="m-0 border-none p-0 outline-none h-full data-[state=active]:flex flex-col">
              <TabBacklogOverview />
            </TabsContent>
            <TabsContent value="processing" className="m-0 border-none p-0 outline-none h-full data-[state=active]:flex flex-col">
              <TabProcessingTime />
            </TabsContent>
            <TabsContent value="rfe" className="m-0 border-none p-0 outline-none h-full data-[state=active]:flex flex-col">
              <TabRfeTrends />
            </TabsContent>
            <TabsContent value="visa" className="m-0 border-none p-0 outline-none h-full data-[state=active]:flex flex-col">
              <TabVisaBulletin />
            </TabsContent>
            <TabsContent value="court" className="m-0 border-none p-0 outline-none h-full data-[state=active]:flex flex-col">
              <TabCourtBacklog />
            </TabsContent>
            <TabsContent value="historical" className="m-0 border-none p-0 outline-none h-full data-[state=active]:flex flex-col">
              <TabHistorical />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
