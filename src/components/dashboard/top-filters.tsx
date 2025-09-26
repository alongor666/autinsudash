'use client';
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
import { ChevronDown } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

export function TopFilters() {
  const { filterOptions, filters, setFilters } = useData();

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
    const newTypes = checked
      ? [...(filters.businessTypes || []), type]
      : (filters.businessTypes || []).filter((t) => t !== type);
    setFilters({ ...filters, businessTypes: newTypes });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 pb-4">
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
              {filters.businessTypes?.length > 0
                ? filters.businessTypes.join(', ')
                : '选择业务类型'}
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
    </div>
  );
}
