'use client';
import React, { useState } from 'react';
import { DashboardHeader, type DashboardSection } from '@/components/dashboard/header';
import { KpiGrid } from '@/components/dashboard/kpi-grid';
import { WeeklyTrendChart } from '@/components/dashboard/weekly-trend';
import { CustomerPerformanceCharts } from '@/components/dashboard/customer-performance';
import { ComparisonAnalysisChart } from '@/components/dashboard/comparison-analysis';
import { AppProviders } from '@/contexts/app-providers';
import { FilterSummary, FilterSummaryTitle } from '@/components/dashboard/filter-summary';
import { SettingsMenu } from '@/components/dashboard/settings-menu';
import { cn } from '@/lib/utils';

const sectionDescriptions: Record<DashboardSection, string> = {
  settings: '',
  overview: '',
  trend: '洞察最近12周的绝对值与率值走势，支持多周对比与维度筛选。',
  structure: '对比不同维度的占比分布与关键指标，快速识别结构性机会。',
  comparison: '跨维度对比各类指标数据，支持灵活切换维度与指标进行深度分析。',
  expense: '基于14%基准线衡量费用结余，为精细化成本管理提供决策依据。',
};

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');

  const renderSection = (section: DashboardSection) => {
    const baseClasses = 'relative overflow-hidden rounded-3xl border panel-surface p-8 shadow-[0_32px_90px_rgba(15,23,42,0.16)] backdrop-blur-xl transition-all duration-500';
    const accentClasses = 'before:pointer-events-none before:absolute before:-inset-[30%] before:bg-[radial-gradient(circle_at_top,rgba(100,116,139,0.14),transparent)] before:opacity-70';

    if (section === 'settings') {
      return (
        <section className={cn(baseClasses, 'before:pointer-events-none before:absolute before:-inset-[30%] before:bg-[radial-gradient(circle_at_top,rgba(100,116,139,0.14),transparent)]')}>
          <div className="relative z-[1] flex flex-col gap-6">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">设置</h3>
            <SettingsMenu />
          </div>
        </section>
      );
    }

    if (section === 'overview') {
      return (
        <section className={cn(baseClasses, accentClasses)}>
          <div className="relative z-[1] flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">经营概览</h3>
            </div>
            <KpiGrid />
          </div>
        </section>
      );
    }

    if (section === 'trend') {
      return (
        <section className={cn(baseClasses, 'before:pointer-events-none before:absolute before:-inset-y-[45%] before:left-1/2 before:translate-x-[-50%] before:bg-[radial-gradient(circle_at_center,rgba(100,116,139,0.14),transparent)]')}>
          <div className="relative z-[1] flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">趋势洞察</h3>
              <p className="text-sm text-muted-foreground/80">{sectionDescriptions.trend}</p>
            </div>
            <WeeklyTrendChart />
          </div>
        </section>
      );
    }

    if (section === 'structure') {
      return (
        <section className={cn(baseClasses, 'before:pointer-events-none before:absolute before:-inset-[35%] before:bg-[radial-gradient(circle_at_top_right,rgba(100,116,139,0.14),transparent)]')}>
          <div className="relative z-[1] flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">结构分析</h3>
              <p className="text-sm text-muted-foreground/80">{sectionDescriptions.structure}</p>
            </div>
            <CustomerPerformanceCharts section="structure" />
          </div>
        </section>
      );
    }

    if (section === 'comparison') {
      return (
        <section className={cn(baseClasses, 'before:pointer-events-none before:absolute before:-inset-[30%] before:bg-[radial-gradient(circle_at_center,rgba(100,116,139,0.14),transparent)]')}>
          <div className="relative z-[1] flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">对比分析</h3>
              <p className="text-sm text-muted-foreground/80">{sectionDescriptions.comparison}</p>
            </div>
            <ComparisonAnalysisChart />
          </div>
        </section>
      );
    }

    return (
      <section className={cn(baseClasses, 'before:pointer-events-none before:absolute before:-inset-[30%] before:bg-[radial-gradient(circle_at_bottom_left,rgba(100,116,139,0.14),transparent)]')}>
        <div className="relative z-[1] flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">费用分析</h3>
            <p className="text-sm text-muted-foreground/80">{sectionDescriptions.expense}</p>
          </div>
          <CustomerPerformanceCharts section="expense" />
        </div>
      </section>
    );
  };

  return (
    <AppProviders>
      <div className="flex min-h-screen w-full flex-col">
        <DashboardHeader activeSection={activeSection} onSectionChange={setActiveSection} />
        <main className="flex-1">
          <section className="mx-auto flex w-full max-w-[92rem] flex-col gap-12 px-4 pb-16 pt-12 md:px-8 xl:px-12">
            {activeSection !== 'settings' && (
              <div className="flex flex-col items-center gap-4 text-center">
                <FilterSummaryTitle />
                <FilterSummary />
              </div>
            )}

            {renderSection(activeSection)}

            {/* 底部说明文字 */}
            {activeSection !== 'settings' && (
              <div className="mt-8 text-center">
                <span className="text-sm text-muted-foreground/70">
                  切换至设置板块可进行数据导入、导出及筛选配置。
                </span>
              </div>
            )}
          </section>
        </main>
      </div>
    </AppProviders>
  );
}
