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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { filterOptions } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import React from 'react';

type FilterSidebarProps = {
  onSearchChange: (value: string) => void;
  suggestedFilters: string[];
  isSearching: boolean;
};

export function FilterSidebar({ onSearchChange, suggestedFilters, isSearching }: FilterSidebarProps) {
  const [date, setDate] = React.useState<DateRange | undefined>();

  const dimensionLabels: { [key: string]: string } = {
    years: '年度',
    weeks: '周次',
    orgLevels: '机构层级',
    cities: '城市',
    insuranceTypes: '保险类型',
    policyTypes: '保单类型',
    renewalStatus: '新/续保状态',
    vehicleTypes: '车辆类型',
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
              placeholder="预测式筛选..."
              className="pl-8"
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Predictive filter search"
            />
            {isSearching && <div className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
          </div>
        </SidebarGroup>
        <Accordion type="multiple" defaultValue={['comparison', 'dimensions']} className="w-full px-2">
          <AccordionItem value="comparison">
            <AccordionTrigger>对比分析</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <RadioGroup defaultValue="yoy" className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yoy" id="yoy" />
                  <Label htmlFor="yoy">同比</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mom" id="mom" />
                  <Label htmlFor="mom">环比</Label>
                </div>
              </RadioGroup>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(date.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>自定义范围</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="dimensions">
            <AccordionTrigger>多维筛选</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              {Object.entries(filterOptions).map(([key, options]) => (
                <div key={key}>
                  <Label className="text-xs text-muted-foreground">
                    {dimensionLabels[key]}
                  </Label>
                  <Select>
                    <SelectTrigger aria-label={`Filter by ${dimensionLabels[key]}`}>
                      <SelectValue placeholder="全部" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((option) => (
                        <SelectItem key={option} value={option} className={cn(suggestedFilters.includes(option) && 'bg-accent/50 font-semibold')}>
                           {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SidebarContent>
    </Sidebar>
  );
}
