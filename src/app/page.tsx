'use client';
import React, { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { KpiGrid } from '@/components/dashboard/kpi-grid';
import { MainChart } from '@/components/dashboard/main-chart';
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
    <div className="flex items-center justify-end gap-2">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
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
      <Button
        variant="outline"
        size="sm"
        onClick={() => document.getElementById('csv-upload')?.click()}
      >
        <Upload className="mr-2 h-4 w-4" />
        导入 CSV
      </Button>
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="mr-2 h-4 w-4" />
        导出
      </Button>
      <Button variant="ghost" size="icon" className="rounded-full">
        <Bell className="h-5 w-5" />
        <span className="sr-only">通知</span>
      </Button>
      <Button variant="ghost" size="icon" className="rounded-full">
        <Settings className="h-5 w-5" />
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
        <main className="flex-1 space-y-4 p-4 md:p-6">
          <div className="text-center mb-4">
            <FilterSummaryTitle />
          </div>
          <div className="flex items-center justify-between mb-4">
            <FilterSummary />
            <PageActions />
          </div>
          <KpiGrid />
          <div className="grid gap-4 md:grid-cols-1">
            <MainChart />
          </div>
        </main>
      </div>
    </DataProvider>
  );
}
