'use client';
import { useEffect, useState } from 'react';
import { useData } from '@/contexts/data-context';
import { Filters, RawDataRow } from '@/lib/types';
import { format } from 'date-fns';
import { businessTypeAliases } from '@/lib/data';

function getLatestSnapshotDate(data: RawDataRow[]): Date | null {
  if (!data || data.length === 0) {
    return null;
  }
  const validDates = data
    .map(row => new Date(row.snapshot_date))
    .filter(date => !isNaN(date.getTime()));

  if (validDates.length === 0) {
    return null;
  }
  
  const latestDate = new Date(Math.max(...validDates.map(date => date.getTime())));
  return latestDate;
}

function getBusinessTypeAlias(selectedTypes: string[], allTypes: string[]): string {
    if (!selectedTypes || selectedTypes.length === 0 || selectedTypes.length === allTypes.length) {
        return '';
    }

    const selectedSet = new Set(selectedTypes);
    
    for (const alias of businessTypeAliases) {
        if (alias.matchFunction(selectedSet, allTypes)) {
            return alias.name;
        }
    }

    if (selectedTypes.length > 2) {
      return `多种业务(${selectedTypes.length})`;
    }

    return selectedTypes.join('、');
}


function generateSummaryText(filters: Filters, allBusinessTypes: string[]): string {
    const orgPart = filters.region || '四川分公司';
    const yearPart = filters.year ? `${filters.year}年` : '';
    const weekPart = filters.weekNumber ? `第${filters.weekNumber}周` : '';

    const insuranceTypes = (filters.insuranceTypes || []).join('、');
    
    const businessTypePart = getBusinessTypeAlias(filters.businessTypes || [], allBusinessTypes);

    let description = [yearPart, weekPart, businessTypePart].filter(Boolean).join(' ');
    
    if (insuranceTypes) {
      description = `${yearPart} ${weekPart} ${insuranceTypes}${businessTypePart ? `(${businessTypePart})` : ''}`.trim();
    }
    
    if (!description && filters.year) {
        description = `${filters.year}年`;
    }

    if (insuranceTypes && !businessTypePart) {
        description += '车险';
    }
    
    if(!description) {
        description = '整体';
    }

    return `${orgPart} ${description}经营概况`;
}

export function FilterSummary() {
  const { rawData, filteredData, filters } = useData();
  const [displayDate, setDisplayDate] = useState<Date | null>(null);

  useEffect(() => {
    // If a week is selected, find the snapshot date from the filtered data.
    // Otherwise, find the latest date from all raw data.
    const dataForDate = filters.weekNumber ? filteredData : rawData;
    setDisplayDate(getLatestSnapshotDate(dataForDate));
  }, [rawData, filteredData, filters.weekNumber]);

  return (
    <div className="text-sm text-muted-foreground flex-grow self-end">
        {displayDate && (
            <span>数据统计截至: {format(displayDate, 'yyyy-MM-dd')}</span>
        )}
    </div>
  );
}

export function FilterSummaryTitle() {
  const { filters, filterOptions } = useData();
  const [summary, setSummary] = useState("数据概况");
  
  useEffect(() => {
    const newSummary = generateSummaryText(filters, filterOptions.businessTypes);
    setSummary(newSummary);
  }, [filters, filterOptions.businessTypes]);

  return (
      <h2 className="text-2xl font-semibold text-center flex-grow">{summary}</h2>
  );
}
