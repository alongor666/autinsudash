'use client';

import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useData } from '@/contexts/data-context';
import { parseCSV, exportToCSV, exportCSVTemplate } from '@/lib/csv';
import type { Filters } from '@/lib/types';
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
  Monitor
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type MenuSection = 'data' | 'filter' | 'notification' | 'personalization' | null;

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
        "w-full group relative flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-all duration-200",
        "hover:bg-gradient-to-r hover:from-violet-50/80 hover:to-fuchsia-50/60",
        "border border-transparent hover:border-violet-200/50 hover:shadow-sm",
        isActive && "bg-gradient-to-r from-violet-50/80 to-fuchsia-50/60 border-violet-200/50 shadow-sm"
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 text-violet-600 transition-all group-hover:from-violet-500/20 group-hover:to-fuchsia-500/20">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-foreground group-hover:text-violet-700 transition-colors">
          {title}
        </div>
        <div className="text-xs text-muted-foreground/70 mt-0.5 truncate">
          {description}
        </div>
      </div>
      {hasSubmenu && (
        <ChevronRight className={cn(
          "h-4 w-4 text-muted-foreground/50 transition-all",
          "group-hover:text-violet-600 group-hover:translate-x-0.5",
          isActive && "text-violet-600 translate-x-0.5"
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
}

function SubMenuItem({ icon, title, description, onClick, disabled }: SubMenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-violet-50/50 hover:shadow-sm"
      )}
    >
      <div className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-violet-600/80 transition-all",
        !disabled && "group-hover:text-violet-700"
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn(
          "font-medium text-sm transition-colors",
          disabled ? "text-foreground/50" : "text-foreground group-hover:text-violet-700"
        )}>
          {title}
        </div>
        <div className="text-xs text-muted-foreground/60 mt-0.5 truncate">
          {description}
        </div>
      </div>
    </button>
  );
}

type Theme = 'light' | 'dark' | 'auto';

export function SettingsMenu() {
  const { toast } = useToast();
  const { setRawData, filteredData, filterOptions, filters, setFilters } = useData();
  const [activeMenu, setActiveMenu] = useState<MenuSection>(null);
  const [theme, setTheme] = useState<Theme>('light');
  const [draftFilters, setDraftFilters] = useState<Filters>(filters);

  // 从 localStorage 加载主题设置
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) setTheme(savedTheme);
    }
  }, []);

  // 同步 filters 到 draftFilters
  React.useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

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

  const handleDownloadTemplate = () => {
    try {
      exportCSVTemplate('车险数据模板.csv');
      toast({
        title: "模板下载成功",
        description: "CSV模板文件已开始下载，请按照模板格式准备您的数据。",
      });
    } catch(error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: "模板下载失败",
        description: "下载模板时发生错误。",
      });
    }
  };

  // 处理主题切换
  const handleThemeChange = (value: Theme, enabled: boolean) => {
    if (!enabled) {
      toast({
        title: "功能即将推出",
        description: "该主题模式正在开发中，敬请期待。",
      });
      return;
    }

    setTheme(value);
    localStorage.setItem('theme', value);

    if (value === 'light') {
      document.documentElement.classList.remove('dark');
    }

    toast({
      title: "主题已更新",
      description: `已切换到${value === 'light' ? '浅色' : value === 'dark' ? '深色' : '跟随系统'}模式`,
    });
  };

  const renderSubMenu = () => {
    if (activeMenu === 'data') {
      return (
        <div className="space-y-1.5">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground/70 tracking-wide">
            数据管理
          </div>
          <input
            type="file"
            id="csv-upload"
            className="hidden"
            accept=".csv"
            onChange={handleFileUpload}
          />
          <SubMenuItem
            icon={<Upload className="h-4 w-4" />}
            title="导入 CSV"
            description="上传车险数据文件"
            onClick={() => document.getElementById('csv-upload')?.click()}
          />
          <SubMenuItem
            icon={<Download className="h-4 w-4" />}
            title="下载模板"
            description="获取标准CSV模板"
            onClick={handleDownloadTemplate}
          />
          <SubMenuItem
            icon={<FileText className="h-4 w-4" />}
            title="导出数据"
            description="导出当前筛选结果"
            onClick={handleExport}
          />
        </div>
      );
    }

    if (activeMenu === 'filter') {
      const yearOptions = filterOptions.years || [];
      const weekOptions = filterOptions.weekNumbers || [];
      const regionOptions = filterOptions.regions || [];
      const businessTypeOptions = filterOptions.businessTypes || [];

      // 三级机构分组
      const chengduRegions = ['天府', '高新', '新都', '青羊', '武侯', '本部'];
      const otherRegions = ['宜宾', '泸州', '德阳', '资阳', '乐山', '自贡', '达州'];

      const handleYearChange = (year: string) => {
        setDraftFilters({ ...draftFilters, year: year === draftFilters.year ? null : year });
      };

      const handleWeekChange = (value: string) => {
        if (value === 'all') {
          setDraftFilters({ ...draftFilters, weekNumber: null });
        } else if (value === 'latest' && weekOptions.length > 0) {
          setDraftFilters({ ...draftFilters, weekNumber: [weekOptions[weekOptions.length - 1]] });
        } else if (value === 'recent4' && weekOptions.length > 0) {
          setDraftFilters({ ...draftFilters, weekNumber: weekOptions.slice(-4) });
        } else if (value === 'recent12' && weekOptions.length > 0) {
          setDraftFilters({ ...draftFilters, weekNumber: weekOptions.slice(-12) });
        } else {
          setDraftFilters({ ...draftFilters, weekNumber: [value] });
        }
      };

      const handleRegionToggle = (region: string) => {
        const currentRegions = draftFilters.region || regionOptions;
        const isSelected = currentRegions.includes(region);

        let newRegions: string[] | null;
        if (isSelected) {
          newRegions = currentRegions.filter(r => r !== region);
          if (newRegions.length === 0) newRegions = [];
        } else {
          newRegions = [...currentRegions, region];
          if (newRegions.length === regionOptions.length) newRegions = null;
        }

        setDraftFilters({ ...draftFilters, region: newRegions });
      };

      const handleRegionGroup = (group: 'all' | 'chengdu' | 'other' | 'invert') => {
        const currentRegions = draftFilters.region || regionOptions;

        if (group === 'all') {
          setDraftFilters({ ...draftFilters, region: null });
        } else if (group === 'chengdu') {
          const validChengdu = chengduRegions.filter(r => regionOptions.includes(r));
          setDraftFilters({ ...draftFilters, region: validChengdu });
        } else if (group === 'other') {
          const validOther = otherRegions.filter(r => regionOptions.includes(r));
          setDraftFilters({ ...draftFilters, region: validOther });
        } else if (group === 'invert') {
          const inverted = regionOptions.filter(r => !currentRegions.includes(r));
          setDraftFilters({ ...draftFilters, region: inverted.length === regionOptions.length ? null : inverted });
        }
      };

      const handleBusinessTypeToggle = (type: string) => {
        const currentTypes = draftFilters.businessTypes || businessTypeOptions;
        const isSelected = currentTypes.includes(type);

        let newTypes: string[] | null;
        if (isSelected) {
          newTypes = currentTypes.filter(t => t !== type);
          if (newTypes.length === 0) newTypes = [];
        } else {
          newTypes = [...currentTypes, type];
          if (newTypes.length === businessTypeOptions.length) newTypes = null;
        }

        setDraftFilters({ ...draftFilters, businessTypes: newTypes });
      };

      const handleBusinessTypeGroup = (group: 'all' | 'invert') => {
        const currentTypes = draftFilters.businessTypes || businessTypeOptions;

        if (group === 'all') {
          setDraftFilters({ ...draftFilters, businessTypes: null });
        } else if (group === 'invert') {
          const inverted = businessTypeOptions.filter(t => !currentTypes.includes(t));
          setDraftFilters({ ...draftFilters, businessTypes: inverted.length === businessTypeOptions.length ? null : inverted });
        }
      };

      const handleApplyFilters = () => {
        setFilters(draftFilters);
        toast({
          title: "筛选已应用",
          description: "仪表板已根据您的选择更新。",
        });
      };

      const handleCancelFilters = () => {
        setDraftFilters(filters);
        toast({
          title: "筛选已取消",
          description: "已恢复到上次应用的筛选条件。",
        });
      };

      const selectedRegions = draftFilters.region || regionOptions;
      const selectedBusinessTypes = draftFilters.businessTypes || businessTypeOptions;

      const getCurrentWeekValue = () => {
        if (draftFilters.weekNumber === null) return 'all';
        if (draftFilters.weekNumber.length === 1) {
          const week = draftFilters.weekNumber[0];
          if (weekOptions.length > 0 && week === weekOptions[weekOptions.length - 1]) return 'latest';
          return week;
        }
        if (draftFilters.weekNumber.length === 4) return 'recent4';
        if (draftFilters.weekNumber.length === 12) return 'recent12';
        return 'all';
      };

      return (
        <div className="space-y-4">
          {/* 顶部确认/取消按钮 */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
            <div className="text-xs font-semibold text-muted-foreground/70 tracking-wide">智能筛选</div>
            <div className="flex gap-2">
              <button
                onClick={handleCancelFilters}
                className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-all"
              >
                取消
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-3 py-1 text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-md shadow-sm transition-all"
              >
                应用
              </button>
            </div>
          </div>

          {/* 保单年度 */}
          <div className="space-y-2">
            <div className="px-3 text-xs font-medium text-muted-foreground/80">保单年度</div>
            <div className="flex flex-wrap gap-2 px-3">
              {yearOptions.map((year) => (
                <button
                  key={year}
                  onClick={() => handleYearChange(year)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    draftFilters.year === year
                      ? "bg-violet-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {/* 周序号 */}
          <div className="space-y-2">
            <div className="px-3 text-xs font-medium text-muted-foreground/80">周序号</div>
            <div className="px-3">
              <Select value={getCurrentWeekValue()} onValueChange={handleWeekChange}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="选择周序号" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="latest">最新一周</SelectItem>
                  <SelectItem value="recent4">最近4周</SelectItem>
                  <SelectItem value="recent12">最近12周</SelectItem>
                  {weekOptions.length > 0 && <div className="border-t my-1" />}
                  {weekOptions.slice().reverse().map((week) => (
                    <SelectItem key={week} value={week}>第 {week} 周</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 三级机构 */}
          <div className="space-y-2">
            <div className="px-3 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground/80">三级机构</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRegionGroup('chengdu')}
                  className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                >
                  成都机构
                </button>
                <button
                  onClick={() => handleRegionGroup('other')}
                  className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                >
                  异地机构
                </button>
                <button
                  onClick={() => handleRegionGroup('all')}
                  className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                >
                  全选
                </button>
                <button
                  onClick={() => handleRegionGroup('invert')}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                >
                  反选
                </button>
              </div>
            </div>
            <div className="px-3 space-y-3">
              {/* 第一行：成都机构 */}
              <div>
                <div className="text-xs text-gray-500 mb-1.5">成都机构</div>
                <div className="grid grid-cols-3 gap-2">
                  {chengduRegions.filter(r => regionOptions.includes(r)).map((region) => {
                    const isSelected = selectedRegions.includes(region);
                    return (
                      <button
                        key={region}
                        onClick={() => handleRegionToggle(region)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium text-center transition-all duration-200",
                          isSelected
                            ? "bg-violet-50 text-violet-700 border border-violet-200"
                            : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                        )}
                      >
                        {region}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 第二行：异地机构 */}
              <div>
                <div className="text-xs text-gray-500 mb-1.5">异地机构</div>
                <div className="grid grid-cols-3 gap-2">
                  {otherRegions.filter(r => regionOptions.includes(r)).map((region) => {
                    const isSelected = selectedRegions.includes(region);
                    return (
                      <button
                        key={region}
                        onClick={() => handleRegionToggle(region)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium text-center transition-all duration-200",
                          isSelected
                            ? "bg-violet-50 text-violet-700 border border-violet-200"
                            : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                        )}
                      >
                        {region}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 业务类型 */}
          <div className="space-y-2">
            <div className="px-3 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground/80">业务类型</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBusinessTypeGroup('all')}
                  className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                >
                  全选
                </button>
                <button
                  onClick={() => handleBusinessTypeGroup('invert')}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                >
                  反选
                </button>
              </div>
            </div>
            <div className="px-3 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-4 gap-2">
                {businessTypeOptions.map((type) => {
                  const isSelected = selectedBusinessTypes.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => handleBusinessTypeToggle(type)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-medium text-center transition-all duration-200",
                        isSelected
                          ? "bg-violet-50 text-violet-700 border border-violet-200"
                          : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                      )}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
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
              <Palette className="h-3.5 w-3.5 text-violet-600/70" />
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
                        ? "border-violet-500 bg-violet-50 shadow-sm"
                        : "border-gray-200/60 hover:border-violet-300 hover:bg-gray-50",
                      !option.enabled && "opacity-40 cursor-not-allowed hover:border-gray-200/60 hover:bg-transparent"
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md transition-all",
                      theme === option.value && option.enabled
                        ? "bg-violet-600 text-white"
                        : "bg-gray-100 text-gray-500",
                      !option.enabled && "bg-gray-50"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={cn(
                      "text-xs font-medium text-center",
                      theme === option.value && option.enabled ? "text-violet-700" : "text-gray-600"
                    )}>
                      {option.label}
                    </span>
                    {!option.enabled && (
                      <span className="absolute -top-1 -right-1 text-[10px] text-white bg-gray-400 px-1 py-0.5 rounded-full leading-none">
                        待开放
                      </span>
                    )}
                    {theme === option.value && option.enabled && (
                      <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-white shadow-md">
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
    </div>
  );
}
