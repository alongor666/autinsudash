'use client';
import { useEffect, useState } from 'react';
import { useData } from '@/contexts/data-context';
import { Filters, RawDataRow } from '@/lib/types';
import { format } from 'date-fns';

function getLatestSnapshotDate(data: RawDataRow[]): Date | null {
  if (!data || data.length === 0) {
    return null;
  }
  // Assuming dates are in a parsable format and we want the most recent one.
  const latestDate = new Date(
    Math.max(
      ...data.map(row => new Date(row.snapshot_date).getTime())
    )
  );
  return isNaN(latestDate.getTime()) ? null : latestDate;
}

function generateSummaryText(filters: Filters, latestDate: Date | null): string {
    const hasFilters = Object.values(filters).some(v => (Array.isArray(v) ? v.length > 0 : v !== null));

    if (!hasFilters) {
        return '全量数据经营概况';
    }

    const datePart = latestDate ? `截至${format(latestDate, 'yyyy年M月d日')}，` : '';
    
    const orgPart = filters.region || '四川分公司';
    const yearPart = filters.year ? `${filters.year}年` : '';

    const insuranceTypes = (filters.insuranceTypes || []).join('、');
    const businessTypes = (filters.businessTypes || []).join('、');
    
    let description = [yearPart, insuranceTypes, businessTypes].filter(Boolean).join('');
    
    // Handle cases where no specific sub-filter is selected
    if (!description && filters.year) {
        description = `${filters.year}年`;
    }

    if (insuranceTypes && !businessTypes) {
        description += '车险';
    } else if (!insuranceTypes && !businessTypes && !yearPart) {
         description = "整体"; // Default case if only a region is selected
    }


    return `${datePart}${orgPart}${description}经营概况`;
}

export function FilterSummary() {
  const { filters, rawData } = useData();
  const [summary, setSummary] = useState("数据概况");
  const [latestDate, setLatestDate] = useState<Date | null>(null);

  useEffect(() => {
     setLatestDate(getLatestSnapshotDate(rawData));
  }, [rawData]);

  useEffect(() => {
    const newSummary = generateSummaryText(filters, latestDate);
    setSummary(newSummary);
  }, [filters, latestDate]);

  return (
    <div className="text-center py-2">
      <h2 className="text-xl font-semibold text-foreground tracking-tight">{summary}</h2>
    </div>
  );
}
