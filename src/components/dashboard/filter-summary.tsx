'use client';
import { useEffect, useState } from 'react';
import { useData } from '@/contexts/data-context';
import { Filters, RawDataRow } from '@/lib/types';
import { format } from 'date-fns';
import { customerCategoryCombinations } from '@/lib/data';

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

function getCustomerCategoryCombination(selectedCategories: string[], allCategories: string[]): string {
    if (!selectedCategories || selectedCategories.length === 0 || selectedCategories.length === allCategories.length) {
        return '';
    }

    const selectedSet = new Set(selectedCategories);

    for (const combination of customerCategoryCombinations) {
        if (combination.matchFunction(selectedSet, allCategories)) {
            return combination.name;
        }
    }

    if (selectedCategories.length > 2) {
      return `多种客户(${selectedCategories.length})`;
    }

    return selectedCategories.join('、');
}


function generateSummaryText(filters: Filters, allCustomerCategories: string[]): string {
    const orgPart = filters.region || '四川分公司';
    const yearPart = filters.year ? `${filters.year}年` : '';
    const weekPart = filters.weekNumber ? `第${filters.weekNumber}周` : '';

    const insuranceTypes = (filters.insuranceTypes || []).join('、');

    const customerCategoryPart = getCustomerCategoryCombination(filters.customerCategories || [], allCustomerCategories);

    let description = [yearPart, weekPart, customerCategoryPart].filter(Boolean).join(' ');

    if (insuranceTypes) {
      description = `${yearPart} ${weekPart} ${insuranceTypes}${customerCategoryPart ? `(${customerCategoryPart})` : ''}`.trim();
    }

    if (!description && filters.year) {
        description = `${filters.year}年`;
    }

    if (insuranceTypes && !customerCategoryPart) {
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
    <div className="text-sm text-muted-foreground/70">
        {displayDate && (
            <span>数据更新至 {format(displayDate, 'yyyy-MM-dd')}</span>
        )}
    </div>
  );
}

export function FilterSummaryTitle() {
  const { filters, filterOptions } = useData();
  const [summary, setSummary] = useState("数据概况");
  
  useEffect(() => {
    const newSummary = generateSummaryText(filters, filterOptions.customerCategories);
    setSummary(newSummary);
  }, [filters, filterOptions.customerCategories]);

  return (
      <h2 className="font-headline text-3xl font-semibold tracking-[-0.04em] text-foreground md:text-[44px]">
        {summary}
      </h2>
  );
}
