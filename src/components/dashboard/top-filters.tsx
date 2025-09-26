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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { Filters } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';

export function TopFilters() {
  const { filterOptions, filters, setFilters } = useData();
  const [draftFilters, setDraftFilters] = useState<Filters>(filters);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  const handleYearChange = (year: string) => {
    setFilters({ ...filters, year: year === 'all' ? null : year });
  };

  const handleRegionChange = (region: string) => {
    setFilters({ ...filters, region: region === 'all' ? null : region });
  };

  const handleWeekNumberChange = (week: string) => {
    setFilters({ ...filters, weekNumber: week === 'all' ? null : week });
  };

  const handleBusinessTypeChange = (type: string, checked: boolean) => {
    const currentTypes = filters.businessTypes || [];
    const newTypes = checked
      ? [...currentTypes, type]
      : currentTypes.filter((t) => t !== type);
    setFilters({ ...filters, businessTypes: newTypes });
  };
  
  const handleInsuranceTypeChange = (type: string, checked: boolean) => {
     const newTypes = checked
      ? [...(draftFilters.insuranceTypes || []), type]
      : (draftFilters.insuranceTypes || []).filter((t) => t !== type);
    setDraftFilters({ ...draftFilters, insuranceTypes: newTypes });
  };

 const handleNewEnergyChange = (status: string, checked: boolean) => {
    const newStatus = checked
     ? [...(draftFilters.newEnergyStatus || []), status]
     : (draftFilters.newEnergyStatus || []).filter((s) => s !== status);
    setDraftFilters({ ...draftFilters, newEnergyStatus: newStatus });
 };

  const handleTransferredStatusChange = (status: string, checked: boolean) => {
    const newStatus = checked
      ? [...(draftFilters.transferredStatus || []), status]
      : (draftFilters.transferredStatus || []).filter(s => s !== status);
    setDraftFilters({ ...draftFilters, transferredStatus: newStatus });
  };

  const handleCoverageTypeChange = (type: string, checked: boolean) => {
    const newTypes = checked
      ? [...(draftFilters.coverageTypes || []), type]
      : (draftFilters.coverageTypes || []).filter(t => t !== type);
    setDraftFilters({ ...draftFilters, coverageTypes: newTypes });
  };

  const applyAdvancedFilters = () => {
    setFilters(draftFilters);
    setIsPopoverOpen(false);
    toast({
      title: '更多筛选已应用',
      description: '仪表板已根据您的选择更新。',
    });
  };

  const resetDraft = () => {
    setDraftFilters(filters);
    toast({
      title: '重置成功',
      description: '筛选条件已恢复。',
      variant: 'default',
    });
  };

  const dimensionLabels: { [key: string]: string } = {
    insuranceTypes: '车险种类',
    coverageTypes: '险别组合',
    newEnergyStatus: '是否新能源车',
    transferredStatus: '是否过户车',
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 pb-4">
      <div className="flex items-center gap-2">
        <Label>保单年度:</Label>
        <Select onValueChange={handleYearChange} value={filters.year || 'all'}>
          <SelectTrigger className="w-[120px]" aria-label="按年份筛选">
            <SelectValue placeholder="选择年度" />
          </SelectTrigger>
          <SelectContent>
            {(filterOptions.years || []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

       <div className="flex items-center gap-2">
        <Label>周序号:</Label>
        <Select onValueChange={handleWeekNumberChange} value={filters.weekNumber || 'all'}>
          <SelectTrigger className="w-[120px]" aria-label="按周序号筛选">
            <SelectValue placeholder="选择周" />
          </SelectTrigger>
          <SelectContent>
             <SelectItem value="all">全部</SelectItem>
            {(filterOptions.weekNumbers || []).map((option) => (
              <SelectItem key={option} value={option}>
                {`第 ${option} 周`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label>三级机构:</Label>
        <Select onValueChange={handleRegionChange} value={filters.region || 'all'}>
          <SelectTrigger className="w-[180px]" aria-label="按三级机构筛选">
            <SelectValue placeholder="选择机构" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <ScrollArea className="h-60">
              {(filterOptions.regions || []).map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label>业务类型:</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-between">
              <span className="truncate">
                {filters.businessTypes && filters.businessTypes.length > 0
                  ? filters.businessTypes.join(', ')
                  : '选择业务类型'}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
             <ScrollArea className="h-60">
                <div className="p-4 space-y-2">
                {(filterOptions.businessTypes || []).map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                        id={`businessType-${option}`}
                        value={option}
                        checked={(filters.businessTypes || []).includes(option)}
                        onCheckedChange={(checked) =>
                        handleBusinessTypeChange(option, !!checked)
                        }
                    />
                    <Label htmlFor={`businessType-${option}`} className="font-normal">
                        {option}
                    </Label>
                    </div>
                ))}
                </div>
             </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            更多筛选
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">更多筛选</h4>
              <p className="text-sm text-muted-foreground">
                在这里选择更多筛选维度。
              </p>
            </div>
            <Accordion type="multiple" className="w-full">
                <AccordionItem value="insuranceTypes">
                    <AccordionTrigger>{dimensionLabels['insuranceTypes']}</AccordionTrigger>
                    <AccordionContent className="space-y-2 pt-2">
                    {(filterOptions.insuranceTypes || []).map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                        <Checkbox 
                            id={`type-${option}`} 
                            value={option}
                            checked={(draftFilters.insuranceTypes || []).includes(option)}
                            onCheckedChange={(checked) => handleInsuranceTypeChange(option, !!checked)}
                        />
                        <Label htmlFor={`type-${option}`} className="font-normal">
                            {option}
                        </Label>
                        </div>
                    ))}
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="coverageTypes">
                    <AccordionTrigger>{dimensionLabels['coverageTypes']}</AccordionTrigger>
                    <AccordionContent className="space-y-2 pt-2 max-h-40 overflow-y-auto">
                    {(filterOptions.coverageTypes || []).map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                            id={`coverageType-${option}`}
                            value={option}
                            checked={(draftFilters.coverageTypes || []).includes(option)}
                            onCheckedChange={(checked) => handleCoverageTypeChange(option, !!checked)}
                        />
                        <Label htmlFor={`coverageType-${option}`} className="font-normal">
                            {option}
                        </Label>
                        </div>
                    ))}
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="newEnergyStatus">
                    <AccordionTrigger>{dimensionLabels['newEnergyStatus']}</AccordionTrigger>
                    <AccordionContent className="space-y-2 pt-2">
                    {(filterOptions.newEnergyStatus || []).map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                            id={`newEnergyStatus-${option}`}
                            value={option}
                            checked={(draftFilters.newEnergyStatus || []).includes(option)}
                            onCheckedChange={(checked) => handleNewEnergyChange(option, !!checked)}
                        />
                        <Label htmlFor={`newEnergyStatus-${option}`} className="font-normal">
                            {option}
                        </Label>
                        </div>
                    ))}
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="transferredStatus">
                    <AccordionTrigger>{dimensionLabels['transferredStatus']}</AccordionTrigger>
                    <AccordionContent className="space-y-2 pt-2">
                    {(filterOptions.transferredStatus || []).map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                            id={`transferredStatus-${option}`}
                            value={option}
                            checked={(draftFilters.transferredStatus || []).includes(option)}
                            onCheckedChange={(checked) => handleTransferredStatusChange(option, !!checked)}
                        />
                        <Label htmlFor={`transferredStatus-${option}`} className="font-normal">
                            {option}
                        </Label>
                        </div>
                    ))}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            <Separator />
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={resetDraft}>重置</Button>
                <Button onClick={applyAdvancedFilters}>应用筛选</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
