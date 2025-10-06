import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

type KpiVisualVariant = 'signedPremium' | 'lossRatio' | 'expenseRatio' | 'marginal' | 'neutral';

type VariantStyle = {
  card: string;
  label: string;
  badgeShadow: string;
};

const variantStyles: Record<KpiVisualVariant, VariantStyle> = {
  signedPremium: {
    card: 'border-violet-100/80 bg-gradient-to-br from-violet-50/80 via-white/70 to-violet-100/30 shadow-[0_18px_40px_rgba(109,40,217,0.12)]',
    label: 'text-violet-700',
    badgeShadow: 'shadow-[0_4px_12px_rgba(109,40,217,0.18)]',
  },
  lossRatio: {
    card: 'border-fuchsia-100/80 bg-gradient-to-br from-fuchsia-50/80 via-white/70 to-fuchsia-100/25 shadow-[0_18px_40px_rgba(162,28,175,0.12)]',
    label: 'text-fuchsia-700',
    badgeShadow: 'shadow-[0_4px_12px_rgba(162,28,175,0.18)]',
  },
  expenseRatio: {
    card: 'border-purple-100/80 bg-gradient-to-br from-purple-50/80 via-white/70 to-purple-100/25 shadow-[0_18px_40px_rgba(126,34,206,0.12)]',
    label: 'text-purple-700',
    badgeShadow: 'shadow-[0_4px_12px_rgba(126,34,206,0.18)]',
  },
  marginal: {
    card: 'border-indigo-100/80 bg-gradient-to-br from-indigo-50/80 via-white/70 to-indigo-100/25 shadow-[0_18px_40px_rgba(79,70,229,0.12)]',
    label: 'text-indigo-700',
    badgeShadow: 'shadow-[0_4px_12px_rgba(79,70,229,0.18)]',
  },
  neutral: {
    card: 'border-white/60 bg-white/80 shadow-[0_16px_36px_rgba(15,23,42,0.08)]',
    label: 'text-muted-foreground',
    badgeShadow: 'shadow-sm',
  },
};

type KpiMetricCardProps = {
  label: string;
  value: string;
  change?: string;
  changeValue?: string;
  changeType?: 'increase' | 'decrease';
  previousValue?: string;
  isPrimary?: boolean;
  highlighted?: boolean;
  variant?: KpiVisualVariant;
};

export function KpiMetricCard({
  label,
  value,
  change,
  changeValue,
  changeType,
  previousValue,
  isPrimary = false,
  highlighted = false,
  variant = 'neutral',
}: KpiMetricCardProps) {
  const visual = variantStyles[variant] ?? variantStyles.neutral;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden rounded-3xl border bg-white/80 transition-all duration-300 backdrop-blur',
        visual.card,
        'hover:-translate-y-1',
        highlighted && 'ring-2 ring-primary/60 shadow-[0_20px_60px_rgba(109,40,217,0.15)]',
      )}
    >
      <CardContent className={cn(
        "relative z-10",
        "p-5"
      )}>
        <div className="flex flex-col" style={{ minHeight: isPrimary ? '90px' : '90px' }}>
          {/* 指标名称 - 固定高度 */}
          <div className={cn(
            "font-medium tracking-[-0.01em] mb-1.5",
            isPrimary ? "text-sm h-5" : "text-xs h-5",
            visual.label
          )}>
            {label}
          </div>

          {/* 指标值区域 - 固定高度 */}
          <div className="flex items-baseline gap-2 mb-1.5" style={{ height: '34px' }}>
            <div className={cn(
              "font-semibold tracking-[-0.02em] text-foreground leading-none",
              isPrimary ? "text-[28px]" : "text-[22px]"
            )}>
              {value}
            </div>
            {previousValue && (
              <div className="text-xs text-muted-foreground/50 leading-none">
                上周: {previousValue}
              </div>
            )}
          </div>

          {/* 环比变化区域 - 固定高度 */}
          <div className="flex items-center gap-1.5" style={{ height: '20px', minHeight: '20px' }}>
            {change && changeType ? (
              <>
                <span className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur',
                  changeType === 'increase'
                    ? 'bg-violet-100/80 text-violet-700'
                    : 'bg-slate-100/80 text-slate-700',
                  visual.badgeShadow
                )}>
                  {changeType === 'increase' ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                  {change}
                </span>
                {changeValue && (
                  <span className="text-[10px] text-muted-foreground/70">{changeValue}</span>
                )}
              </>
            ) : (
              <span className="text-[10px] text-transparent">-</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
