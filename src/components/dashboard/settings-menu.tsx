'use client';

import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useData } from '@/contexts/data-context';
import { exportToCSV, exportCSVTemplate } from '@/lib/csv';
import { useCsvWorker } from '@/hooks/use-csv-worker';
import type { Filters } from '@/lib/types';
import { UnifiedFilter } from './unified-filter';
import {
  ChevronRight,
  Upload,
  Download,
  Filter,
  Bell,
  Palette,
  Database,
  FileText,
  Sun,
  Moon,
  Trash2,
  Monitor,
  X
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { cn, mergeRawDataByWeekAndDims } from '@/lib/utils';

type MenuSection = 'data' | 'filter' | 'notification' | 'personalization' | null;

interface SettingsMenuProps {
  onBack?: () => void;
}

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  isActive?: boolean;
  hasSubmenu?: boolean;
}

function MenuItem({ icon, title, description, onClick, isActive, hasSubmenu }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200",
        isActive
          ? "bg-blue-50 border border-blue-200 shadow-sm"
          : "bg-white/50 border border-gray-200/50 hover:bg-blue-50/50 hover:border-blue-200/50"
      )}
    >
      <div className={cn(
        "flex-shrink-0 p-2 rounded-md transition-colors",
        isActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn(
          "font-medium text-sm",
          isActive ? "text-blue-900" : "text-gray-900"
        )}>
          {title}
        </div>
        <div className="text-xs text-muted-foreground/70 mt-0.5">
          {description}
        </div>
      </div>
      {hasSubmenu && (
        <ChevronRight className={cn(
          "h-4 w-4 transition-transform",
          isActive ? "text-blue-600 rotate-90" : "text-gray-400"
        )} />
      )}
    </button>
  );
}

interface SubMenuItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

function SubMenuItem({ icon, title, description, onClick, disabled, destructive }: SubMenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200",
        disabled
          ? "opacity-50 cursor-not-allowed bg-gray-50/50"
        : destructive
          ? "hover:bg-red-50 hover:border-red-200"
          : "bg-white/70 hover:bg-white hover:shadow-sm border border-transparent hover:border-violet-200/30"
      )}
    >
      <div className={cn(
        "flex-shrink-0 p-1.5 rounded-md",
        disabled
          ? "bg-gray-100 text-gray-400"
          : destructive
            ? "bg-red-100 text-red-600"
            : "bg-violet-100 text-violet-600"
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn(
          "font-medium text-sm",
          destructive ? "text-red-900" : "text-gray-900"
        )}>
          {title}
        </div>
        <div className={cn(
          "text-xs mt-0.5",
          destructive ? "text-red-600/70" : "text-muted-foreground/70"
        )}>
          {description}
        </div>
      </div>
    </button>
  );
}

type Theme = 'light' | 'dark' | 'auto';

export function SettingsMenu({ onBack }: SettingsMenuProps) {
  const { toast } = useToast();
  const {
    rawData,
    filteredData,
    filters,
    filterOptions,
    setFilters,
    timePeriod,
    setTimePeriod,
    setRawData,
    clearAllData
  } = useData();
  
  const [activeMenu, setActiveMenu] = useState<MenuSection>(null);
  const [theme, setTheme] = useState<Theme>('light');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { progress, isProcessing, parseFile } = useCsvWorker();

  const handleThemeChange = (newTheme: Theme, enabled: boolean) => {
    if (!enabled) {
      toast({
        title: "功能暂未开放",
        description: "该主题模式正在开发中，敬请期待！",
        variant: "default",
      });
      return;
    }
    setTheme(newTheme);
    toast({
      title: "主题已更新",
      description: `已切换到${newTheme === 'light' ? '浅色' : newTheme === 'dark' ? '深色' : '跟随系统'}模式`,
      variant: "default",
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const incoming = await parseFile(file);
      // 幂等合并：周+维度键覆盖，统计变化
      const { merged, stats } = mergeRawDataByWeekAndDims(rawData, incoming);
      // 将合并结果写入全局数据（并持久化到 IndexedDB）
      setRawData(merged);

      const weeksLabel = stats.weeks.length ? `周次：${stats.weeks.join('、')}` : '周次：—';
      const summary = `新增 ${stats.added}，更新 ${stats.updated}，删除 ${stats.removed}，跳过 ${stats.skipped}`;
      toast({
        title: "数据导入成功",
        description: `${summary}（${weeksLabel}）`,
        variant: "default",
      });
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "导入失败",
        description: error instanceof Error ? error.message : "文件处理过程中出现错误",
        variant: "destructive",
      });
    }
  };

  const handleExportData = () => {
    if (filteredData.length === 0) {
      toast({
        title: "无数据可导出",
        description: "当前筛选条件下没有数据",
        variant: "destructive",
      });
      return;
    }

    try {
      exportToCSV(filteredData, '筛选数据导出');
      toast({
        title: "导出成功",
        description: `已导出 ${filteredData.length} 条数据`,
        variant: "default",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "导出失败",
        description: "数据导出过程中出现错误",
        variant: "destructive",
      });
    }
  };

  const handleExportTemplate = () => {
    try {
      exportCSVTemplate();
      toast({
        title: "模板下载成功",
        description: "CSV导入模板已下载",
        variant: "default",
      });
    } catch (error) {
      console.error('Template export error:', error);
      toast({
        title: "模板下载失败",
        description: "模板下载过程中出现错误",
        variant: "destructive",
      });
    }
  };

  const handleClearData = async () => {
    try {
      await clearAllData();
      setShowClearConfirm(false);
      toast({
        title: "数据已清除",
        description: "所有本地数据已成功删除",
        variant: "default",
      });
    } catch (error) {
      console.error('Clear data error:', error);
      toast({
        title: "清除失败",
        description: "删除数据时出现错误",
        variant: "destructive",
      });
    }
  };

  const renderSubMenu = () => {
    if (activeMenu === 'data') {
      return (
        <div className="space-y-1.5">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground/70 tracking-wide">
            数据管理
          </div>
          <div className="space-y-4">
            <div className="bg-white/70 rounded-lg p-4 border border-violet-200/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-violet-600" />
                  <span className="text-sm font-medium">数据导入</span>
                </div>
                <button
                  onClick={() => document.getElementById('csv-upload')?.click()}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-violet-600 text-white text-xs rounded-md hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? '导入中...' : '选择文件'}
                </button>
              </div>
              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">正在处理文件... {progress}%</p>
                </div>
              )}
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
          <SubMenuItem
            icon={<Download className="h-4 w-4" />}
            title="导出当前数据"
            description={`导出筛选后的数据 (${filteredData.length} 条)`}
            onClick={handleExportData}
          />
          <SubMenuItem
            icon={<FileText className="h-4 w-4" />}
            title="下载导入模板"
            description="获取标准CSV导入模板"
            onClick={handleExportTemplate}
          />
          <SubMenuItem
            icon={<Trash2 className="h-4 w-4" />}
            title="清除所有数据"
            description={`删除所有本地数据 (当前 ${rawData.length} 条)`}
            onClick={() => setShowClearConfirm(true)}
            destructive
          />
        </div>
      );
    }

    if (activeMenu === 'filter') {
      return (
        <div className="space-y-4">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground/70 tracking-wide">
            智能筛选
          </div>
          
          <div className="px-3">
            <UnifiedFilter onClose={() => setActiveMenu(null)} />
          </div>
        </div>
      );
    }

    if (activeMenu === 'notification') {
      return (
        <div className="space-y-1.5">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground/70 tracking-wide">
            通知
          </div>
          <SubMenuItem
            icon={<Bell className="h-4 w-4" />}
            title="提醒规则"
            description="配置KPI异常提醒（即将推出）"
            onClick={() => {}}
            disabled
          />
          <SubMenuItem
            icon={<Bell className="h-4 w-4" />}
            title="推送设置"
            description="管理通知推送方式（即将推出）"
            onClick={() => {}}
            disabled
          />
        </div>
      );
    }

    if (activeMenu === 'personalization') {
      const themeOptions = [
        { value: 'light' as Theme, label: '浅色', icon: Sun, enabled: true },
        { value: 'dark' as Theme, label: '深色', icon: Moon, enabled: false },
        { value: 'auto' as Theme, label: '跟随系统', icon: Monitor, enabled: false }
      ];

      return (
        <div className="space-y-1.5">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground/70 tracking-wide">
            个性化
          </div>

          {/* 主题设置 - 一级菜单项 */}
          <div className="space-y-2 rounded-lg bg-white/50 p-3">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="h-3.5 w-3.5 text-blue-600/70" />
              <span className="text-xs font-medium text-foreground/80">主题设置</span>
            </div>

            {/* 三种模式 - 二级选项，横向排列 */}
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleThemeChange(option.value, option.enabled)}
                    disabled={!option.enabled}
                  className={cn(
                    "group relative flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all duration-200",
                    theme === option.value && option.enabled
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-gray-200/60 hover:border-blue-300 hover:bg-gray-50",
                    !option.enabled && "opacity-40 cursor-not-allowed hover:border-gray-200/60 hover:bg-transparent"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md transition-all",
                    theme === option.value && option.enabled
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-500",
                    !option.enabled && "bg-gray-50"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={cn(
                    "text-xs font-medium text-center",
                    theme === option.value && option.enabled ? "text-blue-700" : "text-gray-600"
                  )}>
                    {option.label}
                  </span>
                  {!option.enabled && (
                    <span className="absolute -top-1 -right-1 text-[10px] text-white bg-gray-400 px-1 py-0.5 rounded-full leading-none">
                      待开放
                    </span>
                  )}
                  {theme === option.value && option.enabled && (
                    <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
                      <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          </div>

          {/* 指标配置 - 一级菜单项 */}
          <SubMenuItem
            icon={<Database className="h-4 w-4" />}
            title="指标配置"
            description="自定义KPI展示顺序（即将推出）"
            onClick={() => {}}
            disabled
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      {/* 左侧主菜单 */}
      <div className="space-y-2">
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground/70 tracking-wide">
          设置菜单
        </div>
        <MenuItem
          icon={<Database className="h-5 w-5" />}
          title="数据管理"
          description="导入、导出数据"
          onClick={() => setActiveMenu(activeMenu === 'data' ? null : 'data')}
          isActive={activeMenu === 'data'}
          hasSubmenu
        />
        <MenuItem
          icon={<Filter className="h-5 w-5" />}
          title="智能筛选"
          description="配置筛选条件"
          onClick={() => setActiveMenu(activeMenu === 'filter' ? null : 'filter')}
          isActive={activeMenu === 'filter'}
          hasSubmenu
        />
        <MenuItem
          icon={<Bell className="h-5 w-5" />}
          title="通知"
          description="提醒和推送设置"
          onClick={() => setActiveMenu(activeMenu === 'notification' ? null : 'notification')}
          isActive={activeMenu === 'notification'}
          hasSubmenu
        />
        <MenuItem
          icon={<Palette className="h-5 w-5" />}
          title="个性化"
          description="主题和显示配置"
          onClick={() => setActiveMenu(activeMenu === 'personalization' ? null : 'personalization')}
          isActive={activeMenu === 'personalization'}
          hasSubmenu
        />
      </div>

      {/* 右侧子菜单 */}
      <div className={cn(
        "rounded-xl border border-violet-200/40 bg-gradient-to-br from-violet-50/40 to-fuchsia-50/30 p-4 transition-all duration-300",
        activeMenu ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        {renderSubMenu()}
      </div>

      {/* 清除数据确认对话框 */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  确认清除所有数据？
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  此操作将删除所有本地存储的数据（共 {rawData.length} 条记录）。此操作不可恢复，请确认是否继续。
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleClearData}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    确认删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
