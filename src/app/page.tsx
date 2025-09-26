'use client';
import React from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { KpiGrid } from '@/components/dashboard/kpi-grid';
import { MainChart } from '@/components/dashboard/main-chart';
import { DataProvider } from '@/contexts/data-context';
import { FilterSummary } from '@/components/dashboard/filter-summary';

export default function DashboardPage() {

  return (
    <DataProvider>
      <div className="flex min-h-screen w-full flex-col">
        <DashboardHeader />
        <main className="flex-1 space-y-4 p-4 md:p-6">
          <FilterSummary />
          <KpiGrid />
          <div className="grid gap-4 md:grid-cols-1">
            <MainChart />
          </div>
        </main>
      </div>
    </DataProvider>
  );
}
