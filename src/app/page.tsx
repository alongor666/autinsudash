'use client';
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import { KpiGrid } from '@/components/dashboard/kpi-grid';
import { MainChart } from '@/components/dashboard/main-chart';
import { AISidebar } from '@/components/dashboard/ai-sidebar';
import { DataProvider } from '@/contexts/data-context';
import { TopFilters } from '@/components/dashboard/top-filters';

export default function DashboardPage() {

  return (
    <DataProvider>
      <SidebarProvider>
        <AISidebar />
        <SidebarInset>
          <DashboardHeader />
          <main className="flex-1 space-y-4 p-4 md:p-6">
            <TopFilters />
            <KpiGrid />
            <div className="grid gap-4 md:grid-cols-1">
              <MainChart />
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </DataProvider>
  );
}
