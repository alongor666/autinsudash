'use client';
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
import { filterOptions } from '@/lib/data';
import { cn } from '@/lib/utils';
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

type FilterSidebarProps = {
  onSearchChange: (value: string) => void;
  suggestedFilters: string[];
  isSearching: boolean;
};

export function FilterSidebar({ onSearchChange, suggestedFilters, isSearching }: FilterSidebarProps) {
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
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Predictive filter search"
            />
            {isSearching && <div className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
          </div>
        </SidebarGroup>
        <Accordion type="multiple" defaultValue={['time', 'regions', 'insuranceTypes']} className="w-full px-2">
          
          <AccordionItem value="time">
            <AccordionTrigger>{dimensionLabels['time']}</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <Select>
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
              <Select>
                <SelectTrigger aria-label="按季度筛选">
                  <SelectValue placeholder="季度" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.quarters.map((option) => (
                    <SelectItem key={option} value={option}>
                       {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
               <Select>
                <SelectTrigger aria-label="按月份筛选">
                  <SelectValue placeholder="月度" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.months.map((option) => (
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
                  <Checkbox id={option} value={option} />
                  <Label htmlFor={option} className="font-normal">
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
                  <Checkbox id={option} value={option} />
                  <Label htmlFor={option} className="font-normal">
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
