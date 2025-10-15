'use client';
import { AppLogo } from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { TimePeriodToggle } from './time-period-toggle';
import { useData } from '@/contexts/data-context';
import { cn } from '@/lib/utils';

export type DashboardSection = 'settings' | 'overview' | 'deep-dive' | 'trend' | 'structure' | 'comparison';

const SECTION_ITEMS: Array<{ id: DashboardSection; label: string; description: string }> = [
  { id: 'settings', label: '设置', description: '设置' },
  { id: 'overview', label: '经营概览', description: '概览' },
  { id: 'deep-dive', label: '深度剖析', description: '剖析' },
  { id: 'trend', label: '趋势洞察', description: '趋势' },
  { id: 'structure', label: '结构分析', description: '结构' },
  { id: 'comparison', label: '对比分析', description: '对比' },
];

type DashboardHeaderProps = {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
};

export function DashboardHeader({ activeSection, onSectionChange }: DashboardHeaderProps) {
  const { timePeriod, setTimePeriod } = useData();
  
  return (
    <header className="sticky top-0 z-40 border-b panel-surface backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-[92rem] items-center justify-between px-4 py-3 md:px-8 xl:px-12">
        <AppLogo />
        <div className="flex items-center gap-6">
          {/* 时间周期切换组件 */}
          <TimePeriodToggle 
            value={timePeriod} 
            onChange={setTimePeriod} 
          />
          
          {/* 导航菜单 */}
          <nav className="flex items-center gap-2 text-sm font-medium text-muted-foreground/80 md:gap-4">
            {SECTION_ITEMS.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <Button
                  key={section.id}
                  type="button"
                  variant={isActive ? 'outline' : 'ghost'}
                  size="sm"
                  className={cn(
                    'rounded-full px-4 py-2 transition-all duration-300',
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white'
                      : 'text-muted-foreground hover:text-foreground hover:bg-blue-50'
                  )}
                  onClick={() => onSectionChange(section.id)}
                >
                  {section.label}
                </Button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
