'use client';
import { useEffect, useState } from 'react';
import { useData } from '@/contexts/data-context';
import { generateFilterSummaryAction } from '@/app/actions';

export function FilterSummary() {
  const { filters } = useData();
  const [summary, setSummary] = useState("正在生成概况...");

  useEffect(() => {
    const generateSummary = async () => {
      setSummary("正在生成概况...");
      const newSummary = await generateFilterSummaryAction(filters);
      setSummary(newSummary);
    };

    generateSummary();
  }, [filters]);

  return (
    <div className="text-center py-2">
      <h2 className="text-xl font-semibold text-foreground tracking-tight">{summary}</h2>
    </div>
  );
}
