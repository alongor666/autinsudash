'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { KPIKey, Kpi, ChartDataPoint, RawDataRow } from '@/lib/types';
import { calculateKPIs, aggregateChartData } from '@/lib/utils';
import { useFilters } from './filter-provider';
import { useData } from './data-provider';

interface KPIContextType {
  kpiData: { [key in KPIKey]: Omit<Kpi, 'title' | 'id'> };
  chartData: ChartDataPoint[];
  previousWeekData: RawDataRow[];
  refreshKPIs: () => void;
}

const KPIContext = createContext<KPIContextType | undefined>(undefined);

/**
 * KPI计算上下文 - 专门负责指标计算和图表数据处理
 * 职责：
 * - KPI指标计算和缓存
 * - 图表数据聚合处理
 * - 周环比数据计算
 * - 计算结果优化缓存
 */
export function KPIProvider({ children }: { children: ReactNode }) {
  const { rawData } = useData();
  const { filteredData, trendFilteredData, filters } = useFilters();

  // 计算前一周数据用于环比
  const previousWeekData = useMemo(() => {
    if (filteredData.length === 0 || rawData.length === 0) return [];

    // 从过滤数据中找到最新周
    const latestWeek = Math.max(...filteredData.map(row => row.week_number));
    const previousWeek = latestWeek - 1;

    if (previousWeek <= 0) return [];

    // 从原始数据中找前一周数据，应用相同的筛选条件（除了周数）
    return rawData.filter(row => {
      const weekMatch = row.week_number === previousWeek;
      const yearMatch = !filters.year || row.policy_start_year.toString() === filters.year;
      const regionMatch = !filters.region || filters.region.includes(row.third_level_organization);
      const typeMatch = !filters.insuranceTypes || filters.insuranceTypes.includes(row.insurance_type);
      const businessTypeMatch = !filters.businessTypes || filters.businessTypes.includes(row.business_type_category);
      const customerCategoryMatch = !filters.customerCategories || filters.customerCategories.includes(row.customer_category_3);
      const energyTypesMatch = !filters.energyTypes || filters.energyTypes.includes(row.is_new_energy_vehicle);
      const transferredStatusMatch = !filters.transferredStatus || filters.transferredStatus.includes(row.is_transferred_vehicle);
      const coverageTypeMatch = !filters.coverageTypes || filters.coverageTypes.includes(row.coverage_type);

      return weekMatch && yearMatch && regionMatch && typeMatch && businessTypeMatch &&
             customerCategoryMatch && energyTypesMatch && transferredStatusMatch && coverageTypeMatch;
    });
  }, [filteredData, rawData, filters]);

  // 图表数据聚合（使用 useMemo 优化性能）
  const chartData = useMemo(() => {
    return aggregateChartData(trendFilteredData);
  }, [trendFilteredData]);

  // KPI计算（使用 useMemo 缓存）
  const kpiData = useMemo(() => {
    return calculateKPIs(filteredData, previousWeekData);
  }, [filteredData, previousWeekData]);

  const refreshKPIs = useMemo(() => {
    return () => {
      // KPI数据已经通过useMemo自动重新计算，此函数保持向后兼容性
      return kpiData;
    };
  }, [kpiData]);

  const value = {
    kpiData,
    chartData,
    previousWeekData,
    refreshKPIs,
  };

  return <KPIContext.Provider value={value}>{children}</KPIContext.Provider>;
}

export function useKPIs() {
  const context = useContext(KPIContext);
  if (context === undefined) {
    throw new Error('useKPIs must be used within a KPIProvider');
  }
  return context;
}