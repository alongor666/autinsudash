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
import { customerCategoryCombinations } from '@/lib/data';
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


  const handleCustomerCategoryCombinationClick = (combinationName: string) => {
    const combination = customerCategoryCombinations.find(c => c.name === combinationName);
    if (!combination) return;

    const allCategories = filterOptions.customerCategories;
    let newSelection: string[] = [];

    if (combination.name === '私家车') {
      newSelection = ['非营业个人客车'].filter(c => allCategories.includes(c));
    } else if (combination.name === '单位客车') {
      newSelection = ['非营业企业客车', '非营业机关客车'].filter(c => allCategories.includes(c));
    } else if (combination.name === '非营客车组合') {
      newSelection = ['非营业个人客车', '非营业企业客车', '非营业机关客车'].filter(c => allCategories.includes(c));
    } else if (combination.name === '营业客运') {
      newSelection = ['营业城市公交', '营业公路客运', '营业出租租赁'].filter(c => allCategories.includes(c));
    } else if (combination.name === '货运车辆') {
      newSelection = ['营业货车', '挂车'].filter(c => allCategories.includes(c));
    } else if (combination.name === '非营货车') {
      newSelection = ['非营业货车'].filter(c => allCategories.includes(c));
    } else if (combination.name === '特种车辆') {
      newSelection = ['特种车'].filter(c => allCategories.includes(c));
    } else if (combination.name === '摩托车业务') {
      newSelection = ['摩托车'].filter(c => allCategories.includes(c));
    } else if (combination.name === '不含摩托车') {
      newSelection = allCategories.filter(c => c !== '摩托车');
    }

    setDraftFilters(prev => ({ ...prev, customerCategories: newSelection }));
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
        customerCategories: null,
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
            <Label>客户类别</Label>
            <div className="space-y-2">
                <p className="text-xs text-muted-foreground">智能切片</p>
                <div className="flex flex-wrap gap-2">
                    {customerCategoryCombinations.map(combination => (
                    <Button key={combination.name} variant="outline" size="sm" onClick={() => handleCustomerCategoryCombinationClick(combination.name)}>
                        {combination.name}
                    </Button>
                    ))}
                </div>
            </div>
            <ScrollArea className="flex-1 rounded-md border p-2">
            {(filterOptions.customerCategories || []).map((option) => (
                <div key={option} className="flex items-center space-x-2 p-1">
                <Checkbox id={`cc-${option}`} checked={draftFilters.customerCategories === null || draftFilters.customerCategories.includes(option)} onCheckedChange={(c) => handleMultiSelectChange('customerCategories', option, !!c)} />
                <Label htmlFor={`cc-${option}`} className="font-normal">{option}</Label>
                </div>
            ))}
            </ScrollArea>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
