'use client';
import { Button } from '@/components/ui/button';
import { Settings, Bell } from 'lucide-react';
import { AppLogo } from '@/components/app-logo';
import React from 'react';

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
       <div className="flex items-center gap-2">
         <AppLogo/>
       </div>

      <div className="flex w-full items-center justify-end gap-2">
        {/* Actions moved to page.tsx */}
      </div>
    </header>
  );
}
