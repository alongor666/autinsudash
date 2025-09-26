'use client';
import React, { useState, useCallback } from 'react';
import { AppLogo } from '@/components/app-logo';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
} from '@/components/ui/sidebar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useData } from '@/contexts/data-context';
import { useToast } from '@/hooks/use-toast';
import { getPredictiveSuggestions } from '@/app/actions';
import { kpiListForAI } from '@/lib/data';
import { Button } from '../ui/button';

function debounce<T extends (...args: any[]) => void>(func: T, delay: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}


export function FilterSidebar() {
  const { filterOptions, filters, setFilters } = useData();
  const [searchInput, setSearchInput] = useState('');
  const [suggestedFilters, setSuggestedFilters] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

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

  const handleYearChange = (year: string) => {
    setFilters({ ...filters, year });
  };
  
  const handleRegionChange = (region: string, checked: boolean) => {
    const newRegions = checked
      ? [...filters.regions, region]
      : filters.regions.filter((r) => r !== region);
    setFilters({ ...filters, regions: newRegions });
  };

  const handleInsuranceTypeChange = (type: string, checked: boolean) => {
     const newTypes = checked
      ? [...filters.insuranceTypes, type]
      : filters.insuranceTypes.filter((t) => t !== type);
    setFilters({ ...filters, insuranceTypes: newTypes });
  };


  const dimensionLabels: { [key: string]: string } = {
    time: '时间',
    regions: '地区',
    insuranceTypes: '险种',
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
                    onClick={() => {
                      if (filterOptions.years.includes(filter)) handleYearChange(filter);
                      if (filterOptions.regions.includes(filter)) handleRegionChange(filter, !filters.regions.includes(filter));
                      if (filterOptions.insuranceTypes.includes(filter)) handleInsuranceTypeChange(filter, !filters.insuranceTypes.includes(filter));
                    }}
                  >
                    {filter}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </SidebarGroup>
        <Accordion type="multiple" defaultValue={['time', 'regions', 'insuranceTypes']} className="w-full px-2">
          
          <AccordionItem value="time">
            <AccordionTrigger>{dimensionLabels['time']}</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <Select onValueChange={handleYearChange} value={filters.year || ''}>
                <SelectTrigger aria-label="按年份筛选">
                  <SelectValue placeholder="年度" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.years.map((option) => (
                    <SelectItem key={option} value={option}>
                       {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="regions">
            <AccordionTrigger>{dimensionLabels['regions']}</AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2">
              {filterOptions.regions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`region-${option}`} 
                    value={option}
                    checked={filters.regions.includes(option)}
                    onCheckedChange={(checked) => handleRegionChange(option, !!checked)}
                  />
                  <Label htmlFor={`region-${option}`} className="font-normal">
                    {option}
                  </Label>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="insuranceTypes">
            <AccordionTrigger>{dimensionLabels['insuranceTypes']}</AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2">
               {filterOptions.insuranceTypes.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`type-${option}`} 
                    value={option}
                    checked={filters.insuranceTypes.includes(option)}
                    onCheckedChange={(checked) => handleInsuranceTypeChange(option, !!checked)}
                  />
                  <Label htmlFor={`type-${option}`} className="font-normal">
                    {option}
                  </Label>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </SidebarContent>
    </Sidebar>
  );
}
