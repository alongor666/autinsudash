'use client';
import { useEffect, useState } from 'react';
import { useData } from '@/contexts/data-context';
import { Filters } from '@/lib/types';

function generateSummaryText(filters: Filters): string {
    if (!Object.values(filters).some(v => (Array.isArray(v) ? v.length > 0 : v !== null))) {
        return '全量数据经营概况';
    }

    const parts = [];
    if (filters.region) {
        parts.push(filters.region);
    }
    if (filters.year) {
        parts.push(`${filters.year}年`);
    }
    if (filters.weekNumber) {
        parts.push(`保单第${filters.weekNumber}周`);
    }
    
    const otherFilters = [
        ...(filters.businessTypes || []),
        ...(filters.insuranceTypes || []),
        ...(filters.coverageTypes || []),
    ].join('、');

    if(otherFilters) {
        parts.push(otherFilters);
    }
    
    parts.push('经营概况');

    return parts.join('');
}


export function FilterSummary() {
  const { filters } = useData();
  const [summary, setSummary] = useState("数据概况");

  useEffect(() => {
    const newSummary = generateSummaryText(filters);
    setSummary(newSummary);
  }, [filters]);

  return (
    <div className="text-center py-2">
      <h2 className="text-xl font-semibold text-foreground tracking-tight">{summary}</h2>
    </div>
  );
}
