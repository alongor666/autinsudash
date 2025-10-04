'use client';
import { AppLogo } from '@/components/app-logo';

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-white/60 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-8">
        <AppLogo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground/80 md:flex">
          <span className="hover:text-foreground transition-colors">经营概览</span>
          <span className="hover:text-foreground transition-colors">趋势洞察</span>
          <span className="hover:text-foreground transition-colors">客户结构</span>
          <span className="hover:text-foreground transition-colors">费用分析</span>
        </nav>
      </div>
    </header>
  );
}
