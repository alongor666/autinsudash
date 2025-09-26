'use client';
import React from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { KpiGrid } from '@/components/dashboard/kpi-grid';
import { MainChart } from '@/components/dashboard/main-chart';
import { DataProvider } from '@/contexts/data-context';
import { FilterSummary, FilterSummaryTitle } from '@/components/dashboard/filter-summary';
import { TopFilters } from '@/components/dashboard/top-filters';
import { Button } from '@/components/ui/button';
import { Upload, Download, Settings, Bell } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useData } from '@/contexts/data-context';
import { parseCSV, exportToCSV } from '@/lib/csv';


function PageActions() {
  const { toast } = useToast();
  const { setRawData, filteredData } = useData();
  
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
    // Reset file input to allow re-uploading the same file
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
      <input
        type="file"
        id="csv-upload"
        className="hidden"
        accept=".csv"
        onChange={handleFileUpload}
      />
      <TopFilters />
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
          <div className="space-y-2">
            <FilterSummaryTitle />
            <div className="flex items-end justify-between">
              <FilterSummary />
              <PageActions />
            </div>
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
