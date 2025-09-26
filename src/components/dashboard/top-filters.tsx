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
import { businessTypeAliases } from '@/lib/data';
import { SheetHeader, SheetTitle } from '../ui/sheet';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

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
    setDraftFilters(prev => ({ ...prev, [dimension]: newValues.length > 0 ? newValues : null }));
  };
  
  const handleRadioGroupChange = (dimension: keyof Filters, value: string) => {
    const newValues = value === 'all' ? [] : [value];
    setDraftFilters(prev => ({ ...prev, [dimension]: newValues }));
  };

  const handleBusinessTypeAliasClick = (aliasName: string) => {
    const alias = businessTypeAliases.find(a => a.name === aliasName);
    if (!alias) return;

    const allTypes = filterOptions.businessTypes;
    let newSelection: string[] = [];
    
    if (alias.name === '货车') {
      newSelection = allTypes.filter(t => t.includes('货') || t.includes('牵引'));
    } else if (alias.name === '大货车') {
        newSelection = allTypes.filter(t => t.includes('9吨及以上'));
    } else if (alias.name === '小货车') {
        newSelection = allTypes.filter(t => t.includes('2吨及以下'));
    } else if (alias.name === '营业货车') {
      newSelection = allTypes.filter(t => (t.includes('货') || t.includes('牵引')) && t.includes('营业'));
    } else if (alias.name === '非营业客车') {
        newSelection = allTypes.filter(t => t.includes('非营业客车'));
    } else if (alias.name === '家自车') {
        newSelection = allTypes.filter(t => t.includes('非营业个人'));
    } else if (alias.name === '不含摩托车') {
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
        businessTypes: [],
        insuranceTypes: [],
        newEnergyStatus: [],
        transferredStatus: [],
        coverageTypes: [],
    };
    setDraftFilters(initialFilters);
  };

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
              <div className="flex flex-col space-y-2 pt-1">
              {(filterOptions.insuranceTypes || []).map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                  <Checkbox id={`it-${option}`} checked={(draftFilters.insuranceTypes || []).includes(option)} onCheckedChange={(c) => handleMultiSelectChange('insuranceTypes', option, !!c)} />
                  <Label htmlFor={`it-${option}`} className="font-normal">{option}</Label>
                  </div>
              ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>是否新能源</Label>
              <RadioGroup
                value={(draftFilters.newEnergyStatus?.length ?? 0) > 0 ? draftFilters.newEnergyStatus![0] : 'all'}
                onValueChange={(v) => handleRadioGroupChange('newEnergyStatus', v)}
                className="flex items-center space-x-4 pt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="nes-all" />
                  <Label htmlFor="nes-all" className="font-normal">全部</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="是" id="nes-yes" />
                  <Label htmlFor="nes-yes" className="font-normal">是</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="否" id="nes-no" />
                  <Label htmlFor="nes-no" className="font-normal">否</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>是否过户车</Label>
              <RadioGroup
                value={(draftFilters.transferredStatus?.length ?? 0) > 0 ? draftFilters.transferredStatus![0] : 'all'}
                onValueChange={(v) => handleRadioGroupChange('transferredStatus', v)}
                className="flex items-center space-x-4 pt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="ts-all" />
                  <Label htmlFor="ts-all" className="font-normal">全部</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="是" id="ts-yes" />
                  <Label htmlFor="ts-yes" className="font-normal">过户</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="否" id="ts-no" />
                  <Label htmlFor="ts-no" className="font-normal">非过户</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2 flex-1 flex flex-col">
              <Label>险别组合</Label>
                <ScrollArea className="flex-1 h-32 rounded-md border p-2">
                {(filterOptions.coverageTypes || []).map((option) => (
                    <div key={option} className="flex items-center space-x-2 p-1">
                    <Checkbox id={`ct-${option}`} checked={(draftFilters.coverageTypes || []).includes(option)} onCheckedChange={(c) => handleMultiSelectChange('coverageTypes', option, !!c)} />
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
                         checked={(draftFilters.region || []).includes(option)} 
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
                    {businessTypeAliases.map(alias => (
                    <Button key={alias.name} variant="outline" size="sm" onClick={() => handleBusinessTypeAliasClick(alias.name)}>
                        {alias.name}
                    </Button>
                    ))}
                </div>
            </div>
            <ScrollArea className="flex-1 rounded-md border p-2">
            {(filterOptions.businessTypes || []).map((option) => (
                <div key={option} className="flex items-center space-x-2 p-1">
                <Checkbox id={`bt-${option}`} checked={(draftFilters.businessTypes || []).includes(option)} onCheckedChange={(c) => handleMultiSelectChange('businessTypes', option, !!c)} />
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
