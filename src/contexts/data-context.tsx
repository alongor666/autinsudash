'use client';

// 临时向后兼容层 - 重新导出新的 Context hooks
// TODO: 迁移所有组件后移除此文件
import { useData as useNewData } from './data-provider';
import { useFilters as useNewFilters } from './filter-provider';
import { useKPIs as useNewKPIs } from './kpi-provider';
import { useUI as useNewUI } from './ui-provider';

/**
 * 向后兼容的 useData hook
 * 组合来自多个新 Context 的数据，保持旧的 API 接口
 */
export function useData() {
  const { rawData, setRawData, loading } = useNewData();
  const { filters, setFilters, filterOptions, filteredData, trendFilteredData, resetFilters } = useNewFilters();
  const { kpiData, chartData } = useNewKPIs();
  const { highlightedKpis, setHighlightedKpis } = useNewUI();

  return {
    // 数据相关
    rawData,
    setRawData,
    filteredData,
    trendFilteredData,
    loading,

    // 筛选相关
    filters,
    setFilters,
    filterOptions,
    resetFilters,

    // 计算结果
    kpiData,
    chartData,

    // UI 状态
    highlightedKpis,
    setHighlightedKpis,
  };
}

// 为了完全向后兼容，也导出一个空的 DataProvider
// 实际的 Provider 由 AppProviders 提供
export function DataProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}