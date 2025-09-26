'use client';
import { AppLogo } from '@/components/app-logo';

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
       <div className="flex items-center gap-2">
         <AppLogo/>
       </div>
    </header>
  );
}
