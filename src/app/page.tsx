'use client';
import React, { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { KpiGrid } from '@/components/dashboard/kpi-grid';
import { MainChart } from '@/components/dashboard/main-chart';
import { DataProvider } from '@/contexts/data-context';
import { FilterSummary, FilterSummaryTitle } from '@/components/dashboard/filter-summary';
import { Sidebar, SidebarContent, SidebarTrigger, SidebarProvider } from '@/components/ui/sidebar';
import { TopFilters } from '@/components/dashboard/top-filters';

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <DataProvider>
      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <div className="flex min-h-screen w-full flex-col">
          <DashboardHeader />
          <div className="flex flex-1">
            <Sidebar className="w-80 border-r" collapsible="icon">
              <SidebarContent>
                <TopFilters />
              </SidebarContent>
            </Sidebar>

            <main className="flex-1 space-y-4 p-4 md:p-6">
               <div className="flex items-center gap-2 mb-4">
                  <SidebarTrigger />
                  <div className="flex-grow">
                    <FilterSummaryTitle />
                  </div>
              </div>
              <FilterSummary />
              <KpiGrid />
              <div className="grid gap-4 md:grid-cols-1">
                <MainChart />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </DataProvider>
  );
}
