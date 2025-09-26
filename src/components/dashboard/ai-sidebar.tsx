'use client';
import React, { useState, useCallback } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
} from '@/components/ui/sidebar';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
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


export function AISidebar() {
  const { filterOptions, setHighlightedKpis } = useData();
  const [searchInput, setSearchInput] = useState('');
  const [suggestedFilters, setSuggestedFilters] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();


  const handleSearch = async (query: string) => {
    setSearchInput(query);
    if (!query) {
      setSuggestedFilters([]);
      setHighlightedKpis([]);
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

  const debouncedSearch = useCallback(debounce(handleSearch, 300), [filterOptions, setHighlightedKpis]);

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="智能洞察..."
              className="pl-8"
              onChange={(e) => debouncedSearch(e.target.value)}
              aria-label="Predictive filter search"
            />
            {isSearching && <div className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
          </div>
           {suggestedFilters.length > 0 && (
            <div className="mt-2 space-y-1">
              <Label className="text-xs text-muted-foreground px-2">筛选建议:</Label>
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
      </SidebarContent>
    </Sidebar>
  );
}
