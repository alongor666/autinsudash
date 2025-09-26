'use client';
import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/data-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from '../ui/scroll-area';
import type { Filters } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { businessTypeCombinations } from '@/lib/data';
import { SheetHeader, SheetTitle } from '../ui/sheet';

interface TopFiltersProps {
  onApply: () => void;
}

export function TopFilters({ onApply }: TopFiltersProps) {
  const { filterOptions, filters, setFilters } = useData();
  const [draftFilters, setDraftFilters] = useState<Filters>(filters);
  const { toast } = useToast();

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  const handleSingleSelectChange = (dimension: keyof Filters, value: string) => {
    setDraftFilters(prev => ({ ...prev, [dimension]: value === 'all' ? null : value }));
  };

  const handleMultiSelectChange = (dimension: keyof Filters, value: string, checked: boolean) => {
    const currentValues = (draftFilters[dimension] as string[] | null) || [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter((v) => v !== value);

    const allOptionsForDimension = filterOptions[dimension as keyof typeof filterOptions] as string[];
    
    // If all options are selected, treat as "all" (null)
    if (newValues.length === allOptionsForDimension?.length) {
      setDraftFilters(prev => ({ ...prev, [dimension]: null }));
    } else {
      setDraftFilters(prev => ({ ...prev, [dimension]: newValues }));
    }
  };


  const handleBusinessTypeCombinationClick = (combinationName: string) => {
    const combination = businessTypeCombinations.find(c => c.name === combinationName);
    if (!combination) return;

    const allTypes = filterOptions.businessTypes;
    let newSelection: string[] = [];

    if (combination.name === '货车') {
      newSelection = [
        '10吨以上-普货',
        '10吨以上-牵引',
        '2-9吨营业货车',
        '2吨以下营业货车',
        '9-10吨营业货车',
        '非营业货车新车',
        '非营业货车旧车'
      ].filter(t => allTypes.includes(t));
    } else if (combination.name === '大货车') {
      newSelection = [
        '10吨以上-普货',
        '10吨以上-牵引',
        '9-10吨营业货车'
      ].filter(t => allTypes.includes(t));
    } else if (combination.name === '小货车') {
      newSelection = [
        '非营业货车新车',
        '2吨以下营业货车',
        '非营业货车旧车'
      ].filter(t => allTypes.includes(t));
    } else if (combination.name === '营业货车') {
      newSelection = [
        '2吨以下营业货车',
        '2-9吨营业货车',
        '9-10吨营业货车',
        '10吨以上-普货',
        '10吨以上-牵引'
      ].filter(t => allTypes.includes(t));
    } else if (combination.name === '非营业客车') {
      newSelection = [
        '非营业客车旧车非过户',
        '非营业客车旧车过户车',
        '非营业客车新车'
      ].filter(t => allTypes.includes(t));
    } else if (combination.name === '家自车') {
      // 根据实际数据，这可能对应的是非营业客车类型
      newSelection = allTypes.filter(t => t.includes('非营业客车'));
    } else if (combination.name === '不含摩托车') {
      newSelection = allTypes.filter(t => t !== '摩托车');
    }

    setDraftFilters(prev => ({ ...prev, businessTypes: newSelection }));
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
    const initialFilters = {
        year: filterOptions.years[0] || null,
        region: null,
        weekNumber: null,
        businessTypes: null,
        insuranceTypes: null,
        newEnergyStatus: null,
        transferredStatus: null,
        coverageTypes: null,
    };
    setDraftFilters(initialFilters);
  };
  
  const binaryOptionMap: Record<string, string> = {
    '交强险': '交',
    '商业险': '商',
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <SheetHeader>
        <SheetTitle className="sr-only">智能筛选</SheetTitle>
      </SheetHeader>
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="text-lg font-semibold">智能筛选</h3>
        <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={resetFilters}>重置</Button>
            <Button size="sm" onClick={applyFilters}>应用筛选</Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
          {/* Column 1: Short lists */}
          <div className="space-y-6 flex flex-col">
            <div className="space-y-2">
              <Label>保单年度</Label>
              <Select onValueChange={(v) => handleSingleSelectChange('year', v)} value={draftFilters.year || 'all'}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {(filterOptions.years || []).map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>周序号</Label>
              <Select onValueChange={(v) => handleSingleSelectChange('weekNumber', v)} value={draftFilters.weekNumber || 'all'}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                    <ScrollArea className="h-40">
                        <SelectItem value="all">全部</SelectItem>
                        {(filterOptions.weekNumbers || []).map((o) => (<SelectItem key={o} value={o}>{`第 ${o} 周`}</SelectItem>))}
                    </ScrollArea>
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label>车险种类</Label>
              <div className="flex items-center space-x-4 pt-1">
                {(filterOptions.insuranceTypes || []).map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                    <Checkbox id={`it-${option}`} checked={draftFilters.insuranceTypes === null || draftFilters.insuranceTypes.includes(option)} onCheckedChange={(c) => handleMultiSelectChange('insuranceTypes', option, !!c)} />
                    <Label htmlFor={`it-${option}`} className="font-normal">{binaryOptionMap[option] || option}</Label>
                    </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>是否新能源</Label>
              <div className="flex items-center space-x-4 pt-1">
                {(filterOptions.newEnergyStatus || []).map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox id={`nes-${option}`} checked={draftFilters.newEnergyStatus === null || draftFilters.newEnergyStatus.includes(option)} onCheckedChange={(c) => handleMultiSelectChange('newEnergyStatus', option, !!c)} />
                    <Label htmlFor={`nes-${option}`} className="font-normal">{option}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>是否过户车</Label>
              <div className="flex items-center space-x-4 pt-1">
                {(filterOptions.transferredStatus || []).map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox id={`ts-${option}`} checked={draftFilters.transferredStatus === null || draftFilters.transferredStatus.includes(option)} onCheckedChange={(c) => handleMultiSelectChange('transferredStatus', option, !!c)} />
                    <Label htmlFor={`ts-${option}`} className="font-normal">{option === '是' ? '过户' : '非过户'}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2 flex-1 flex flex-col">
              <Label>险别组合</Label>
                <ScrollArea className="flex-1 h-32 rounded-md border p-2">
                {(filterOptions.coverageTypes || []).map((option) => (
                    <div key={option} className="flex items-center space-x-2 p-1">
                    <Checkbox id={`ct-${option}`} checked={draftFilters.coverageTypes === null || draftFilters.coverageTypes.includes(option)} onCheckedChange={(c) => handleMultiSelectChange('coverageTypes', option, !!c)} />
                    <Label htmlFor={`ct-${option}`} className="font-normal">{option}</Label>
                    </div>
                ))}
                </ScrollArea>
            </div>
          </div>
          {/* Column 2: Regions */}
          <div className="space-y-2 flex flex-col">
             <Label>三级机构</Label>
             <ScrollArea className="flex-1 rounded-md border">
                 <div className="p-2">
                 {(filterOptions.regions || []).map((option) => (
                     <div key={option} className="flex items-center space-x-2 p-1">
                     <Checkbox id={`region-${option}`} 
                         checked={draftFilters.region === null || draftFilters.region.includes(option)} 
                         onCheckedChange={(c) => handleMultiSelectChange('region', option, !!c)} />
                     <Label htmlFor={`region-${option}`} className="font-normal">{option}</Label>
                     </div>
                 ))}
                 </div>
             </ScrollArea>
           </div>
          {/* Column 3: Business Types */}
          <div className="space-y-2 flex flex-col">
            <Label>业务类型</Label>
            <div className="space-y-2">
                <p className="text-xs text-muted-foreground">智能切片</p>
                <div className="flex flex-wrap gap-2">
                    {businessTypeCombinations.map(combination => (
                    <Button key={combination.name} variant="outline" size="sm" onClick={() => handleBusinessTypeCombinationClick(combination.name)}>
                        {combination.name}
                    </Button>
                    ))}
                </div>
            </div>
            <ScrollArea className="flex-1 rounded-md border p-2">
            {(filterOptions.businessTypes || []).map((option) => (
                <div key={option} className="flex items-center space-x-2 p-1">
                <Checkbox id={`bt-${option}`} checked={draftFilters.businessTypes === null || draftFilters.businessTypes.includes(option)} onCheckedChange={(c) => handleMultiSelectChange('businessTypes', option, !!c)} />
                <Label htmlFor={`bt-${option}`} className="font-normal">{option}</Label>
                </div>
            ))}
            </ScrollArea>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
