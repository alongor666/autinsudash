'use client';

import React, { ReactNode } from 'react';
import { DataProvider } from './data-provider';
import { FilterProvider } from './filter-provider';
import { KPIProvider } from './kpi-provider';
import { UIProvider } from './ui-provider';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * 应用程序上下文组合器
 * 按依赖关系顺序组织所有 Context Providers：
 * DataProvider -> FilterProvider -> KPIProvider -> UIProvider
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <DataProvider>
      <FilterProvider>
        <KPIProvider>
          <UIProvider>
            {children}
          </UIProvider>
        </KPIProvider>
      </FilterProvider>
    </DataProvider>
  );
}

// 向后兼容的导出
export { DataProvider, FilterProvider, KPIProvider, UIProvider };

// 便捷hooks导出
export { useData } from './data-provider';
export { useFilters } from './filter-provider';
export { useKPIs } from './kpi-provider';
export { useUI } from './ui-provider';