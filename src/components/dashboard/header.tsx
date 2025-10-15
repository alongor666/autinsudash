'use client';
import { AppLogo } from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TimePeriodToggle } from './time-period-toggle';

export type DashboardSection = 'settings' | 'overview' | 'trend' | 'structure' | 'comparison' | 'expense';

const SECTION_ITEMS: Array<{ id: DashboardSection; label: string; description: string }> = [
  { id: 'settings', label: '设置', description: '设置' },
  { id: 'overview', label: '经营概览', description: '概览' },
  { id: 'trend', label: '趋势洞察', description: '趋势' },
  { id: 'structure', label: '结构分析', description: '结构' },
  { id: 'comparison', label: '对比分析', description: '对比' },
  { id: 'expense', label: '费用分析', description: '费用' },
];

type DashboardHeaderProps = {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
};

export function DashboardHeader({ activeSection, onSectionChange }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b panel-surface backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-[92rem] items-center justify-between px-4 py-3 md:px-8 xl:px-12">
        <AppLogo />
        <div className="flex items-center gap-3 md:gap-6">
          <nav className="flex items-center gap-2 text-sm font-medium text-muted-foreground/80 md:gap-4">
            {SECTION_ITEMS.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <Button
                  key={section.id}
                  type="button"
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'rounded-full px-4 py-2 transition-all duration-300',
                    isActive
                      ? 'bg-gradient-to-r from-violet-500 via-indigo-500 to-fuchsia-500 text-white shadow-[0_12px_32px_rgba(109,40,217,0.25)]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                  )}
                  onClick={() => onSectionChange(section.id)}
                >
                  {section.label}
                </Button>
              );
            })}
          </nav>
          <TimePeriodToggle />
        </div>
      </div>
    </header>
  );
}
