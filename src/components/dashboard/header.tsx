'use client';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Upload, Download, Settings, Bell } from 'lucide-react';
import { AppLogo } from '@/components/app-logo';
import { useToast } from "@/hooks/use-toast";
import React from 'react';

export function DashboardHeader() {
  const { toast } = useToast();
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File uploaded:', file.name);
      toast({
        title: "文件上传成功",
        description: `文件 ${file.name} 正在处理中。`,
      });
      // In a real app, process the CSV file here.
    }
  };

  const handleExport = () => {
    console.log('Exporting data...');
    toast({
      title: "数据正在导出",
      description: "您的数据将很快开始下载。",
    });
    // In a real app, generate and download the CSV here.
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <div className="hidden md:block">
          {/* Logo is now in sidebar */}
        </div>
      </div>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
         <h1 className="text-xl font-semibold md:hidden"><AppLogo/></h1>
        <div className="ml-auto flex items-center gap-2">
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
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">通知</span>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Settings className="h-5 w-5" />
          <span className="sr-only">设置</span>
        </Button>
      </div>
    </header>
  );
}
