'use client';
import { useData } from '@/contexts/data-context';

export function FilterSummary() {
  const { filters } = useData();

  const generateSummary = () => {
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
    if (filters.businessTypes && filters.businessTypes.length > 0) {
      parts.push(filters.businessTypes.join('/'));
    }
    
    if (parts.length === 0) {
      return "全量数据经营概况";
    }

    return `${parts.join('')}经营概况`;
  };

  const summary = generateSummary();

  return (
    <div className="text-center py-2">
      <h2 className="text-xl font-semibold text-foreground tracking-tight">{summary}</h2>
    </div>
  );
}
