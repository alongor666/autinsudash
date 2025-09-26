'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { AppLogo } from '@/components/app-logo';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Label } from '@/components/ui/label';
import { Search, ChevronsUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useData } from '@/contexts/data-context';
import { useToast } from '@/hooks/use-toast';
import { getPredictiveSuggestions } from '@/app/actions';
import { kpiListForAI } from '@/lib/data';
import { Button } from '../ui/button';
import type { Filters } from '@/lib/types';
import { Separator } from '../ui/separator';

function debounce<T extends (...args: any[]) => void>(func: T, delay: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}


export function FilterSidebar() {
  const { filterOptions, filters, setFilters } = useData();
  const [draftFilters, setDraftFilters] = useState<Filters>(filters);
  const [searchInput, setSearchInput] = useState('');
  const [suggestedFilters, setSuggestedFilters] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const { toast } = useToast();
  const { setOpen, isMobile } = useSidebar();


  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);


  const handleSearch = async (query: string) => {
    setSearchInput(query);
    if (!query) {
      setSuggestedFilters([]);
      return;
    }

    setIsSearching(true);
    try {
      const availableFilters = Object.values(filterOptions).flat();
      const historicalUserBehavior = "用户经常在查看'北京'地区的'商业险'后，关注'赔付率'和'承保利润率'。";
      
      const result = await getPredictiveSuggestions({
        searchInput: query,
        availableFilters,
        kpiList: kpiListForAI,
        historicalUserBehavior,
      });

      setSuggestedFilters(result.suggestedFilters || []);
      // highlightedKpis is not used in the sidebar, but could be passed up to the page component
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

  const debouncedSearch = useCallback(debounce(handleSearch, 300), [filterOptions]);

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
  
  const applyFilters = () => {
    setFilters(draftFilters);
    if (isMobile) {
      setOpen(false);
    }
    toast({
      title: '筛选已应用',
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
    <Sidebar>
      <SidebarHeader>
        <div className="group-data-[collapsible=icon]:hidden">
          <AppLogo />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="智能筛选..."
              className="pl-8"
              onChange={(e) => debouncedSearch(e.target.value)}
              aria-label="Predictive filter search"
            />
            {isSearching && <div className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
          </div>
           {suggestedFilters.length > 0 && (
            <div className="mt-2 space-y-1">
              <Label className="text-xs text-muted-foreground px-2">建议:</Label>
              <div className="flex flex-wrap gap-1 px-2">
                {suggestedFilters.map(filter => (
                  <Button
                    key={filter}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    {filter}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </SidebarGroup>

        <Collapsible open={isMoreFiltersOpen} onOpenChange={setIsMoreFiltersOpen} className="w-full px-2">
            <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-center mt-2">
                    <span className="text-sm">{isMoreFiltersOpen ? '收起高级筛选' : '高级筛选'}</span>
                    <ChevronsUpDown className="h-4 w-4 ml-2" />
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
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
            </CollapsibleContent>
        </Collapsible>

      </SidebarContent>
      <SidebarGroup>
        <Separator className="mb-2" />
        <div className="flex flex-col gap-2">
            <Button onClick={applyFilters}>应用筛选</Button>
            <Button variant="ghost" onClick={resetDraft}>重置</Button>
        </div>
      </SidebarGroup>
    </Sidebar>
  );
}
