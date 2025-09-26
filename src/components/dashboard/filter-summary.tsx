'use client';
import { useEffect, useState } from 'react';
import { useData } from '@/contexts/data-context';
import { Filters, RawDataRow } from '@/lib/types';
import { format } from 'date-fns';

function getLatestSnapshotDate(data: RawDataRow[]): Date | null {
  if (!data || data.length === 0) {
    return null;
  }
  const latestDate = new Date(
    Math.max(
      ...data.map(row => new Date(row.snapshot_date).getTime())
    )
  );
  return isNaN(latestDate.getTime()) ? null : latestDate;
}

function generateSummaryText(filters: Filters): string {
    const orgPart = filters.region || '四川分公司';
    const yearPart = filters.year ? `${filters.year}年` : '';
    const weekPart = filters.weekNumber ? `第${filters.weekNumber}周` : '';

    const insuranceTypes = (filters.insuranceTypes || []).join('、');
    const businessTypes = (filters.businessTypes || []).join('、');
    
    let description = [yearPart, insuranceTypes, weekPart, businessTypes].filter(Boolean).join('');
    
    if (!description && filters.year) {
        description = `${filters.year}年`;
    }

    if (insuranceTypes && !businessTypes) {
        description += '车险';
    }
    
    if(!description) {
        description = '整体';
    }

    return `${orgPart}${description}经营概况`;
}

export function FilterSummary() {
  const { rawData } = useData();
  const [latestDate, setLatestDate] = useState<Date | null>(null);

  useEffect(() => {
     setLatestDate(getLatestSnapshotDate(rawData));
  }, [rawData]);

  return (
    <div className="text-sm text-muted-foreground flex-grow self-end">
        {latestDate && (
            <span>数据统计截至: {format(latestDate, 'yyyy-MM-dd')}</span>
        )}
    </div>
  );
}

export function FilterSummaryTitle() {
  const { filters } = useData();
  const [summary, setSummary] = useState("数据概况");
  
  useEffect(() => {
    const newSummary = generateSummaryText(filters);
    setSummary(newSummary);
  }, [filters]);

  return (
      <h2 className="text-2xl font-semibold flex-grow text-center">{summary}</h2>
  );
}
