'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '@/contexts/data-context';
import type { Filters } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface TopFiltersProps {
  onApply: () => void;
}

const weekLabel = (week: string) => `第 ${week} 周`;

export function TopFilters({ onApply }: TopFiltersProps) {
  const { filterOptions, filters, setFilters } = useData();
  const { toast } = useToast();
  const [draftFilters, setDraftFilters] = useState<Filters>(filters);

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  const yearOptions = useMemo(() => filterOptions.years || [], [filterOptions.years]);
  const weekOptions = useMemo(() => filterOptions.weekNumbers || [], [filterOptions.weekNumbers]);
  const regionOptions = useMemo(() => filterOptions.regions || [], [filterOptions.regions]);

  const handleSingleSelectChange = (dimension: keyof Filters, value: string) => {
    setDraftFilters((prev) => ({ ...prev, [dimension]: value === 'all' ? null : value }));
  };

  const handleMultiSelectChange = (dimension: keyof Filters, value: string, checked: boolean) => {
    const allOptions = dimension === 'region' ? regionOptions : weekOptions;
    const currentRaw = draftFilters[dimension];
    const current = Array.isArray(currentRaw) ? currentRaw : allOptions;

    const updated = checked
      ? Array.from(new Set([...current, value]))
      : current.filter((item) => item !== value);

    const sanitized = updated.filter((item) => allOptions.includes(item));
    const sorted = sanitized.sort((a, b) => allOptions.indexOf(a) - allOptions.indexOf(b));

    if (sorted.length === allOptions.length) {
      setDraftFilters((prev) => ({ ...prev, [dimension]: null }));
    } else {
      setDraftFilters((prev) => ({ ...prev, [dimension]: sorted }));
    }
  };

  const selectedRegions = useMemo(() => {
    if (draftFilters.region === null) {
      return new Set(regionOptions);
    }
    return new Set(draftFilters.region);
  }, [draftFilters.region, regionOptions]);

  const toggleRegion = (value: string) => {
    const shouldSelect = !selectedRegions.has(value);
    handleMultiSelectChange('region', value, shouldSelect);
  };

  const selectOnlyRegion = (value: string) => {
    setDraftFilters((prev) => ({ ...prev, region: [value] }));
  };

  const selectAllRegions = () => {
    setDraftFilters((prev) => ({ ...prev, region: null }));
  };

  const clearRegions = () => {
    setDraftFilters((prev) => ({ ...prev, region: [] }));
  };

  const invertRegions = () => {
    const inverted = regionOptions.filter((item) => !selectedRegions.has(item));
    setDraftFilters((prev) => ({ ...prev, region: inverted.length === regionOptions.length ? null : inverted }));
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    toast({
      title: '筛选已应用',
      description: '仪表板已根据您的选择更新。',
    });
    onApply();
  };

  const resetFilters = () => {
    setDraftFilters({
      year: yearOptions[0] || null,
      weekNumber: null,
      region: null,
      customerCategories: null,
      insuranceTypes: null,
      energyTypes: null,
      transferredStatus: null,
      coverageTypes: null,
    });
  };

  const selectedWeeks = useMemo(() => {
    if (draftFilters.weekNumber === null) {
      return new Set(weekOptions);
    }
    return new Set(draftFilters.weekNumber);
  }, [draftFilters.weekNumber, weekOptions]);

  return (
    <div className="flex h-full flex-col bg-white/80">
      <SheetHeader>
        <SheetTitle className="sr-only">智能筛选</SheetTitle>
      </SheetHeader>
      <div className="flex items-center justify-between border-b panel-surface px-6 py-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">智能筛选</h3>
          <p className="text-xs text-muted-foreground/70">聚焦保单年度、周序号与三级机构，精简筛选更高效。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={resetFilters}>重置</Button>
          <Button size="sm" onClick={applyFilters}>应用筛选</Button>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-6 px-6 py-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,260px)_1fr]">
          <div className="space-y-6 rounded-2xl border panel-surface p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">保单年度</Label>
              <Select onValueChange={(value) => handleSingleSelectChange('year', value)} value={draftFilters.year || 'all'}>
                <SelectTrigger className="h-10 rounded-xl border-white/60 bg-white/80 shadow-inner">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-white/60 bg-white/95">
                  <SelectItem value="all">全部</SelectItem>
                  {yearOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">周序号</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full px-4 text-xs"
                  onClick={() => setDraftFilters((prev) => ({ ...prev, weekNumber: null }))}
                >全部</Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full px-4 text-xs"
                  disabled={weekOptions.length === 0}
                  onClick={() => {
                    if (!weekOptions.length) return;
                    setDraftFilters((prev) => ({ ...prev, weekNumber: [weekOptions[weekOptions.length - 1]] }));
                  }}
                >最新周</Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full px-4 text-xs"
                  disabled={weekOptions.length === 0}
                  onClick={() => {
                    if (!weekOptions.length) return;
                    const recent = weekOptions.slice(-4);
                    setDraftFilters((prev) => ({ ...prev, weekNumber: recent }));
                  }}
                >最近4周</Button>
              </div>
              <ScrollArea className="h-36 rounded-xl border panel-surface p-3">
                <div className="grid gap-2">
                  {weekOptions.map((option) => {
                    const checked = selectedWeeks.has(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        className={cn(
                          'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-200',
                          checked ? 'bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-fuchsia-500/10 text-violet-600' : 'hover:bg-white'
                        )}
                        onClick={() => handleMultiSelectChange('weekNumber', option, !checked)}
                      >
                        <span>{weekLabel(option)}</span>
                        <Checkbox checked={checked} className="pointer-events-none" />
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border panel-surface p-5 shadow-[0_28px_70px_rgba(15,23,42,0.1)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-foreground">三级机构</Label>
                <p className="text-xs text-muted-foreground/70">支持单选、多选与一键反选。</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs" onClick={selectAllRegions}>全选</Button>
                <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs" onClick={clearRegions}>清空</Button>
                <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs" onClick={invertRegions}>反选</Button>
              </div>
            </div>
            <ScrollArea className="h-[320px] rounded-xl border panel-surface p-3">
              <div className="grid gap-2">
                {regionOptions.map((option) => {
                  const active = selectedRegions.has(option);
                  return (
                    <div
                      key={option}
                      className="group flex items-center justify-between rounded-lg bg-transparent px-3 py-2 transition-colors hover:bg-white"
                    >
                      <button
                        type="button"
                        className={cn(
                          'flex flex-1 items-center gap-3 text-sm transition-colors',
                          active ? 'text-violet-600' : 'text-muted-foreground hover:text-foreground'
                        )}
                        onClick={() => toggleRegion(option)}
                      >
                        <Checkbox checked={active} className="pointer-events-none" />
                        <span>{option}</span>
                      </button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 rounded-full px-2 text-xs text-muted-foreground/80 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => selectOnlyRegion(option)}
                      >仅此</Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
