import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

type KpiCardProps = {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  description: string;
  highlighted?: boolean;
};

export function KpiCard({ title, value, change, changeType, description, highlighted = false }: KpiCardProps) {
  const isIncrease = changeType === 'increase';
  
  return (
    <Card className={cn('transition-all duration-300', highlighted && 'ring-2 ring-accent shadow-lg')}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {isIncrease ? <TrendingUp className="h-4 w-4 text-muted-foreground" /> : <TrendingDown className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          <span className={cn(changeType === 'decrease' && 'text-destructive')}>
            {change}
          </span>
          {' '}{description}
        </p>
      </CardContent>
    </Card>
  );
}
