'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Filters, FilterOptions, RawDataRow } from '@/lib/types';
import { filterOptions as defaultFilterOptions } from '@/lib/data';
import { sortByPreferredOrder, ENERGY_TYPE_ORDER, TRANSFER_STATUS_ORDER } from '@/lib/utils';
import { useData } from './data-provider';

interface FilterContextType {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  filterOptions: FilterOptions;
  filteredData: RawDataRow[];
  trendFilteredData: RawDataRow[];
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

const defaultFilters: Filters = {
  year: null,
  region: null,
  insuranceTypes: null,
  businessTypes: null,
  customerCategories: null,
  energyTypes: null,
  weekNumber: null,
  transferredStatus: null,
  coverageTypes: null,
};

/**
 * 筛选状态上下文 - 专门负责筛选逻辑和过滤数据
 * 职责：
 * - 筛选器状态管理
 * - 动态筛选选项生成
 * - 数据过滤逻辑处理
 * - 趋势数据和一般数据分离
 */
export function FilterProvider({ children }: { children: ReactNode }) {
  const { rawData } = useData();
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  // 动态生成筛选选项
  const filterOptions = useMemo(() => {
    if (rawData.length === 0) {
      return defaultFilterOptions;
    }

    const years = [...new Set(rawData.map(row => row.policy_start_year.toString()))]
      .sort((a, b) => b.localeCompare(a));
    const regions = [...new Set(rawData.map(row => row.third_level_organization))].sort();
    const insuranceTypes = [...new Set(rawData.map(row => row.insurance_type))].sort();
    const businessTypes = [...new Set(rawData.map(row => row.business_type_category))].sort();
    const customerCategories = [...new Set(rawData.map(row => row.customer_category_3))].sort();
    const energyTypes = sortByPreferredOrder(
      [...new Set(rawData.map(row => row.is_new_energy_vehicle))],
      ENERGY_TYPE_ORDER,
    );
    const weekNumbers = [...new Set(rawData.map(row => row.week_number.toString()))]
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    const transferredStatus = sortByPreferredOrder(
      [...new Set(rawData.map(row => row.is_transferred_vehicle))],
      TRANSFER_STATUS_ORDER,
    );
    const coverageTypes = [...new Set(rawData.map(row => row.coverage_type))].sort();

    return {
      years,
      regions,
      insuranceTypes,
      businessTypes,
      customerCategories,
      energyTypes,
      weekNumbers,
      transferredStatus,
      coverageTypes
    };
  }, [rawData]);

  // 数据过滤逻辑（使用 useMemo 缓存优化）
  const { filteredData, trendFilteredData } = useMemo(() => {
    const normalizedSelectedWeeks = filters.weekNumber && filters.weekNumber.length
      ? Array.from(new Set(filters.weekNumber))
      : null;

    const sortedSelectedWeeks = normalizedSelectedWeeks
      ? [...normalizedSelectedWeeks].sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
      : null;

    const matchesCommonFilters = (row: RawDataRow) => {
      const yearMatch = !filters.year || row.policy_start_year.toString() === filters.year;
      const regionMatch = !filters.region || filters.region.includes(row.third_level_organization);
      const typeMatch = !filters.insuranceTypes || filters.insuranceTypes.includes(row.insurance_type);
      const businessTypeMatch = !filters.businessTypes || filters.businessTypes.includes(row.business_type_category);
      const customerCategoryMatch = !filters.customerCategories || filters.customerCategories.includes(row.customer_category_3);
      const energyTypesMatch = !filters.energyTypes || filters.energyTypes.includes(row.is_new_energy_vehicle);
      const transferredStatusMatch = !filters.transferredStatus || filters.transferredStatus.includes(row.is_transferred_vehicle);
      const coverageTypeMatch = !filters.coverageTypes || filters.coverageTypes.includes(row.coverage_type);

      // 空数组检查
      if (Array.isArray(filters.region) && filters.region.length === 0) return false;
      if (Array.isArray(filters.insuranceTypes) && filters.insuranceTypes.length === 0) return false;
      if (Array.isArray(filters.businessTypes) && filters.businessTypes.length === 0) return false;
      if (Array.isArray(filters.customerCategories) && filters.customerCategories.length === 0) return false;
      if (Array.isArray(filters.energyTypes) && filters.energyTypes.length === 0) return false;
      if (Array.isArray(filters.transferredStatus) && filters.transferredStatus.length === 0) return false;
      if (Array.isArray(filters.coverageTypes) && filters.coverageTypes.length === 0) return false;

      return yearMatch && regionMatch && typeMatch && businessTypeMatch &&
             customerCategoryMatch && energyTypesMatch && transferredStatusMatch && coverageTypeMatch;
    };

    const matchedRows: RawDataRow[] = [];
    const matchedWeeks = new Set<string>();

    rawData.forEach((row) => {
      if (matchesCommonFilters(row)) {
        matchedRows.push(row);
        matchedWeeks.add(row.week_number.toString());
      }
    });

    const matchedWeekList = Array.from(matchedWeeks).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    // 为一般数据（KPI计算）确定有效周期
    const effectiveGeneralWeeks = sortedSelectedWeeks
      ? (sortedSelectedWeeks.length > 1
        ? [sortedSelectedWeeks[sortedSelectedWeeks.length - 1]]
        : sortedSelectedWeeks)
      : (matchedWeekList.length ? [matchedWeekList[matchedWeekList.length - 1]] : null);

    // 一般过滤数据（用于KPI计算）
    const filteredData: RawDataRow[] = effectiveGeneralWeeks
      ? matchedRows.filter((row) => effectiveGeneralWeeks.includes(row.week_number.toString()))
      : [];

    // 趋势过滤数据（用于图表显示）
    const trendFilteredData: RawDataRow[] = matchedRows.filter((row) => {
      if (!sortedSelectedWeeks) {
        return true;
      }
      return sortedSelectedWeeks.includes(row.week_number.toString());
    });

    return { filteredData, trendFilteredData };
  }, [filters, rawData]);

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const value = {
    filters,
    setFilters,
    filterOptions,
    filteredData,
    trendFilteredData,
    resetFilters,
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}