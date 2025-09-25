'use client';
import React, { useState, useCallback, useTransition } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import { KpiGrid } from '@/components/dashboard/kpi-grid';
import { MainChart } from '@/components/dashboard/main-chart';
import { FilterSidebar } from '@/components/dashboard/filter-sidebar';
import { getPredictiveSuggestions } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

function debounce<T extends (...args: any[]) => void>(func: T, delay: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

export default function DashboardPage() {
  const [highlightedKpis, setHighlightedKpis] = useState<string[]>([]);
  const [suggestedFilters, setSuggestedFilters] = useState<string[]>([]);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleSearch = (query: string) => {
    startTransition(async () => {
      if (!query) {
        setHighlightedKpis([]);
        setSuggestedFilters([]);
        return;
      }
      try {
        const result = await getPredictiveSuggestions(query);
        setSuggestedFilters(result.suggestedFilters || []);
        setHighlightedKpis(result.highlightedKpis || []);
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'AI 建议出错',
          description: '无法获取预测性筛选建议。',
        });
      }
    });
  };

  const debouncedSearch = useCallback(debounce(handleSearch, 300), []);

  return (
    <SidebarProvider>
      <FilterSidebar
        onSearchChange={debouncedSearch}
        suggestedFilters={suggestedFilters}
        isSearching={isPending}
      />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1 space-y-4 p-4 md:p-6">
          <KpiGrid highlightedKpis={highlightedKpis} />
          <div className="grid gap-4 md:grid-cols-1">
            <MainChart />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
