'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type TimePeriod = 'ytd' | 'weekly';

interface TimePeriodToggleProps {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
  className?: string;
}

/**
 * 年累计/当周切换组件
 * 用于在年累计数据和当周数据之间切换
 */
export function TimePeriodToggle({ value, onChange, className }: TimePeriodToggleProps) {
  const options = [
    { value: 'ytd' as TimePeriod, label: '年累计', description: '显示年度累计数据' },
    { value: 'weekly' as TimePeriod, label: '当周', description: '显示当周数据与上周对比' },
  ];

  return (
    <div className={cn('flex items-center gap-1 rounded-lg bg-muted/30 p-1', className)}>
      {options.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? 'outline' : 'ghost'}
          size="sm"
          className={cn(
            'h-7 px-3 text-xs font-medium transition-all duration-200',
            value === option.value
              ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white'
              : 'text-muted-foreground hover:text-foreground hover:bg-blue-50'
          )}
          onClick={() => onChange(option.value)}
          title={option.description}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}