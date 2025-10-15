import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/data-context';
import type { TimePeriod } from '@/lib/types';

const LABELS: Record<TimePeriod, string> = {
  ytd: '年累计',
  weekly: '当周',
};

export function TimePeriodToggle() {
  const { timePeriod, setTimePeriod } = useData();

  const renderButton = (period: TimePeriod) => {
    const isActive = timePeriod === period;
    return (
      <Button
        key={period}
        type="button"
        variant={isActive ? 'default' : 'outline'}
        size="sm"
        onClick={() => setTimePeriod(period)}
        className={isActive ? 'shadow-sm' : 'bg-transparent'}
      >
        {LABELS[period]}
      </Button>
    );
  };

  return (
    <div className="flex items-center gap-2 rounded-full bg-muted/40 p-1">
      {(['ytd', 'weekly'] as TimePeriod[]).map(renderButton)}
    </div>
  );
}
