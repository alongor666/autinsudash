'use client';
import React, { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { KpiGrid } from '@/components/dashboard/kpi-grid';
import { MainChart } from '@/components/dashboard/main-chart';
import { CustomerPerformanceCharts } from '@/components/dashboard/customer-performance';
import { DataProvider } from '@/contexts/data-context';
import { FilterSummary, FilterSummaryTitle } from '@/components/dashboard/filter-summary';
import { TopFilters } from '@/components/dashboard/top-filters';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Filter, Upload, Download, Bell, Settings } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useData } from '@/contexts/data-context';
import { parseCSV, exportToCSV } from '@/lib/csv';

function PageActions() {
  const { toast } = useToast();
  const { setRawData, filteredData } = useData();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "文件上传成功",
        description: `文件 ${file.name} 正在处理中。`,
      });
      try {
        const data = await parseCSV(file);
        setRawData(data);
        toast({
          title: "数据处理完成",
          description: `成功导入 ${data.length} 条记录。`,
        });
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: "CSV 解析失败",
          description: error instanceof Error ? error.message : "未知错误",
        });
      }
    }
    event.target.value = '';
  };

  const handleExport = () => {
    if (filteredData.length === 0) {
      toast({
        variant: 'destructive',
        title: "导出失败",
        description: "没有可导出的数据。",
      });
      return;
    }
    
    try {
      exportToCSV(filteredData, 'dashboard_data.csv');
      toast({
        title: "数据正在导出",
        description: "您的数据将很快开始下载。",
      });
    } catch(error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: "导出失败",
        description: "导出数据时发生错误。",
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
            <Filter className="mr-2 h-[18px] w-[18px]" />
            智能筛选
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full max-w-full sm:max-w-4xl p-0">
          <TopFilters onApply={() => setIsSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      <input
        type="file"
        id="csv-upload"
        className="hidden"
        accept=".csv"
        onChange={handleFileUpload}
      />
      <Button variant="outline" size="sm" onClick={() => document.getElementById('csv-upload')?.click()}>
        <Upload className="mr-2 h-[18px] w-[18px]" />
        导入 CSV
      </Button>
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="mr-2 h-[18px] w-[18px]" />
        导出
      </Button>
      <Button variant="ghost" size="icon">
        <Bell className="h-[18px] w-[18px]" />
        <span className="sr-only">通知</span>
      </Button>
      <Button variant="ghost" size="icon">
        <Settings className="h-[18px] w-[18px]" />
        <span className="sr-only">设置</span>
      </Button>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DataProvider>
      <div className="flex min-h-screen w-full flex-col">
        <DashboardHeader />
        <main className="flex-1">
          <section className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-16 pt-12 md:px-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <FilterSummaryTitle />
              <p className="max-w-2xl text-base text-muted-foreground/80 md:text-lg">
                以苹果官网的极简视觉重塑车险经营仪表板，沉浸式呈现最新周度表现、客户结构与费用效率。
              </p>
              <FilterSummary />
            </div>

            <div className="flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between">
              <div className="text-sm text-muted-foreground/70 md:text-left">
                精准筛选、导入和导出保持不变，帮助你在高保真体验中快速聚焦关键洞察。
              </div>
              <PageActions />
            </div>

            <KpiGrid />
            <div className="grid gap-8">
              <MainChart />
              <CustomerPerformanceCharts />
            </div>
          </section>
        </main>
      </div>
    </DataProvider>
  );
}
