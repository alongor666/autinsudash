'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useData } from '@/contexts/data-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Search, X } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { Filters, SuggestedFilter } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';
import { getPredictiveSuggestions } from '@/app/actions';
import { kpiListForAI } from '@/lib/data';
import { Badge } from '../ui/badge';

export function TopFilters() {
  const { filterOptions, filters, setFilters, setHighlightedKpis } = useData();
  const [draftFilters, setDraftFilters] = useState<Filters>(filters);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState('');
  const [suggestedFilters, setSuggestedFilters] = useState<SuggestedFilter[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [aiDraftFilters, setAiDraftFilters] = useState<SuggestedFilter[]>([]);


  const handleSearch = async () => {
    if (!searchInput) {
      setSuggestedFilters([]);
      setHighlightedKpis([]);
      return;
    }

    setIsSearching(true);
    try {
      const availableFilters = Object.values(filterOptions).flat();
      const historicalUserBehavior = "用户经常在查看'北京'地区的'商业险'后，关注'赔付率'和'承保利润率'。";
      
      const result = await getPredictiveSuggestions({
        searchInput: searchInput,
        availableFilters,
        kpiList: kpiListForAI,
        historicalUserBehavior,
      });

      setSuggestedFilters(result.suggestedFilters || []);
      setHighlightedKpis(result.highlightedKpis || []);
    } catch (error) {
      console.error("Error getting predictive suggestions:", error);
      toast({
        variant: 'destructive',
        title: 'AI 建议出错',
        description: '无法获取预测性筛选建议。',
      });
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters, isPopoverOpen]);

  const handleSingleSelectChange = (dimension: keyof Filters, value: string) => {
    setDraftFilters(prev => ({ ...prev, [dimension]: value === 'all' ? null : value }));
  };

  const handleMultiSelectChange = (dimension: keyof Filters, value: string, checked: boolean) => {
    const currentValues = (draftFilters[dimension] as string[] | null) || [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter((v) => v !== value);
    setDraftFilters(prev => ({ ...prev, [dimension]: newValues }));
  };
  
  const addAiFilter = (filter: SuggestedFilter) => {
    if (!aiDraftFilters.some(f => f.dimension === filter.dimension && f.value === filter.value)) {
        setAiDraftFilters(prev => [...prev, filter]);
    }
  };

  const removeAiFilter = (filterToRemove: SuggestedFilter) => {
    setAiDraftFilters(prev => prev.filter(f => !(f.dimension === filterToRemove.dimension && f.value === filterToRemove.value)));
  };


  const applyAllFilters = () => {
    let combinedFilters = { ...draftFilters };

    aiDraftFilters.forEach(filter => {
      const { dimension, value } = filter;
      switch (dimension) {
        case 'third_level_organization':
            combinedFilters.region = value;
            break;
        case 'business_type_category':
            combinedFilters.businessTypes = [...(combinedFilters.businessTypes || []), value];
            break;
        case 'insurance_type':
            combinedFilters.insuranceTypes = [...(combinedFilters.insuranceTypes || []), value];
            break;
        case 'is_new_energy_vehicle':
            combinedFilters.newEnergyStatus = [...(combinedFilters.newEnergyStatus || []), value];
            break;
        // Extend with other dimensions as needed
      }
    });
    
    // Ensure uniqueness for multi-selects just in case
    if (combinedFilters.businessTypes) combinedFilters.businessTypes = [...new Set(combinedFilters.businessTypes)];
    if (combinedFilters.insuranceTypes) combinedFilters.insuranceTypes = [...new Set(combinedFilters.insuranceTypes)];
    if (combinedFilters.newEnergyStatus) combinedFilters.newEnergyStatus = [...new Set(combinedFilters.newEnergyStatus)];

    setFilters(combinedFilters);
    setIsPopoverOpen(false);
    setAiDraftFilters([]);
    setSearchInput('');
    setSuggestedFilters([]);
    toast({
      title: '筛选已应用',
      description: '仪表板已根据您的选择更新。',
    });
  };

  const resetDraft = () => {
    setDraftFilters(filters);
    setAiDraftFilters([]);
    toast({
      title: '重置成功',
      description: '筛选条件已恢复。',
      variant: 'default',
    });
  };
  
  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          智能筛选
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">智能筛选</h4>
            <p className="text-sm text-muted-foreground">
              在这里手动配置或使用智能洞察。
            </p>
          </div>
          <Separator />
            <div className="relative">
            <Input
              type="search"
              placeholder="输入“成都”、“新车”等获取智能建议..."
              className="pr-8"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              aria-label="Predictive filter search"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-0 top-0 h-full w-10"
              onClick={handleSearch}
              disabled={isSearching}
              aria-label="Search"
            >
              {isSearching ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          
          {suggestedFilters.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">筛选建议:</Label>
              <div className="flex flex-wrap gap-1">
                {suggestedFilters.map(filter => (
                  <Button
                    key={`${filter.dimension}-${filter.value}`}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => addAiFilter(filter)}
                  >
                    {filter.value}
                  </Button>
                ))}
              </div>
            </div>
          )}
            {aiDraftFilters.length > 0 && (
            <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">已选智能筛选:</Label>
                <div className="flex flex-wrap gap-1">
                  {aiDraftFilters.map(filter => (
                      <Badge key={`${filter.dimension}-${filter.value}`} variant="secondary" className="flex items-center gap-1">
                          {filter.value}
                          <button onClick={() => removeAiFilter(filter)} className="rounded-full hover:bg-muted-foreground/20">
                              <X className="h-3 w-3"/>
                          </button>
                      </Badge>
                  ))}
                </div>
            </div>
          )}


          <Separator />
          <Accordion type="multiple" className="w-full" defaultValue={['common']}>
              <AccordionItem value="common">
                <AccordionTrigger>常规筛选</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
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
                           <SelectItem value="all">全部</SelectItem>
                           {(filterOptions.weekNumbers || []).map((o) => (<SelectItem key={o} value={o}>{`第 ${o} 周`}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                      <Label>三级机构</Label>
                      <Select onValueChange={(v) => handleSingleSelectChange('region', v)} value={draftFilters.region || 'all'}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent><ScrollArea className="h-60">
                           <SelectItem value="all">全部</SelectItem>
                           {(filterOptions.regions || []).map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
                        </ScrollArea></SelectContent>
                      </Select>
                  </div>
                   <div className="space-y-2">
                      <Label>业务类型</Label>
                      <ScrollArea className="h-24 rounded-md border p-2">
                      {(filterOptions.businessTypes || []).map((option) => (
                          <div key={option} className="flex items-center space-x-2 p-1">
                          <Checkbox id={`bt-${option}`} checked={(draftFilters.businessTypes || []).includes(option)} onCheckedChange={(c) => handleMultiSelectChange('businessTypes', option, !!c)} />
                          <Label htmlFor={`bt-${option}`} className="font-normal">{option}</Label>
                          </div>
                      ))}
                      </ScrollArea>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="advanced">
                  <AccordionTrigger>高级筛选</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                     <div className="space-y-2">
                      <Label>车险种类</Label>
                      <div className="flex items-center space-x-4">
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
                       <div className="flex items-center space-x-4">
                      {(filterOptions.newEnergyStatus || []).map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                          <Checkbox id={`ne-${option}`} checked={(draftFilters.newEnergyStatus || []).includes(option)} onCheckedChange={(c) => handleMultiSelectChange('newEnergyStatus', option, !!c)} />
                          <Label htmlFor={`ne-${option}`} className="font-normal">{option}</Label>
                          </div>
                      ))}
                      </div>
                    </div>
                     <div className="space-y-2">
                      <Label>是否过户车</Label>
                       <div className="flex items-center space-x-4">
                      {(filterOptions.transferredStatus || []).map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                          <Checkbox id={`ts-${option}`} checked={(draftFilters.transferredStatus || []).includes(option)} onCheckedChange={(c) => handleMultiSelectChange('transferredStatus', option, !!c)} />
                          <Label htmlFor={`ts-${option}`} className="font-normal">{option}</Label>
                          </div>
                      ))}
                      </div>
                    </div>
                     <div className="space-y-2">
                      <Label>险别组合</Label>
                      <ScrollArea className="h-32 rounded-md border p-2">
                      {(filterOptions.coverageTypes || []).map((option) => (
                          <div key={option} className="flex items-center space-x-2 p-1">
                          <Checkbox id={`ct-${option}`} checked={(draftFilters.coverageTypes || []).includes(option)} onCheckedChange={(c) => handleMultiSelectChange('coverageTypes', option, !!c)} />
                          <Label htmlFor={`ct-${option}`} className="font-normal">{option}</Label>
                          </div>
                      ))}
                      </ScrollArea>
                    </div>
                  </AccordionContent>
              </AccordionItem>
          </Accordion>
          <Separator />
          <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={resetDraft}>重置</Button>
              <Button onClick={applyAllFilters}>应用筛选</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
