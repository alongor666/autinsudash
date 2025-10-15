'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { RawDataRow, Filters, FilterOptions, KPIKey, Kpi, ChartDataPoint, TimePeriod } from '@/lib/types';
import { filterOptions as defaultFilterOptions } from '@/lib/data';
import {
  normalizeRawDataRows,
  sortByPreferredOrder,
  ENERGY_TYPE_ORDER,
  TRANSFER_STATUS_ORDER,
} from '@/lib/utils';
import { storeData, getData } from '@/lib/idb';
import { useFilteredData } from '@/hooks/use-filtered-data';
import { useKpiData } from '@/hooks/use-kpi-data';

interface DataContextType {
  rawData: RawDataRow[];
  setRawData: (data: RawDataRow[]) => void;
  timePeriod: TimePeriod;
  setTimePeriod: (period: TimePeriod) => void;
  filteredData: RawDataRow[];
  trendFilteredData: RawDataRow[];
  currentWeekData: RawDataRow[];
  previousWeekData: RawDataRow[];
  prePreviousWeekData: RawDataRow[];
  selectedWeeks: number[];
  currentWeekNumber: number | null;
  previousWeekNumber: number | null;
  availableWeeks: number[];
  filters: Filters;
  setFilters: (filters: Filters) => void;
  filterOptions: FilterOptions;
  kpiData: { [key in KPIKey]: Omit<Kpi, 'title' | 'id'> };
  chartData: ChartDataPoint[];
  cumulativeBaselineRows: RawDataRow[];
  highlightedKpis: string[];
  setHighlightedKpis: (kpis: string[]) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [rawData, setRawDataState] = useState<RawDataRow[]>([]);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('ytd');
  const [filters, setFilters] = useState<Filters>({
    year: null,
    region: null,
    insuranceTypes: null,
    businessTypes: null,
    customerCategories: null,
    energyTypes: null,
    weekNumber: null,
    transferredStatus: null,
    coverageTypes: null,
  });
  const [highlightedKpis, setHighlightedKpis] = useState<string[]>([]);

  // Load data from IndexedDB on initial mount
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getData();
        if (data && Array.isArray(data)) {
           setRawDataState(normalizeRawDataRows(data as RawDataRow[]));
        }
      } catch (error) {
        console.error("Failed to load data from IndexedDB", error);
      }
    }
    loadData();
  }, []);

  const setRawData = useCallback((data: RawDataRow[]) => {
    const normalizedData = normalizeRawDataRows(data);

    storeData(normalizedData)
      .then(() => {
        setRawDataState(normalizedData);
        // Reset filters when new data is loaded to show a complete overview
        setFilters({
            year: null,
            region: null,
            insuranceTypes: null,
            businessTypes: null,
            customerCategories: null,
            energyTypes: null,
            weekNumber: null,
            transferredStatus: null,
            coverageTypes: null,
        });
      })
      .catch((error) => {
        console.error("Failed to save data to IndexedDB", error);
      });
  }, [setFilters, setRawDataState]);


  const filterOptions = useMemo(() => {
     if (rawData.length === 0) {
        return defaultFilterOptions;
     }
     const years = [...new Set(rawData.map(row => row.policy_start_year.toString()))].sort((a,b) => b.localeCompare(a));
     const regions = [...new Set(rawData.map(row => row.third_level_organization))].sort();
     const insuranceTypes = [...new Set(rawData.map(row => row.insurance_type))].sort();
     const businessTypes = [...new Set(rawData.map(row => row.business_type_category))].sort();
     const customerCategories = [...new Set(rawData.map(row => row.customer_category_3))].sort();
     const energyTypes = sortByPreferredOrder(
       [...new Set(rawData.map(row => row.is_new_energy_vehicle))],
       ENERGY_TYPE_ORDER,
     );
     const weekNumbers = [...new Set(rawData.map(row => row.week_number.toString()))].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
     const transferredStatus = sortByPreferredOrder(
       [...new Set(rawData.map(row => row.is_transferred_vehicle))],
       TRANSFER_STATUS_ORDER,
     );
     const coverageTypes = [...new Set(rawData.map(row => row.coverage_type))].sort();
     return { years, regions, insuranceTypes, businessTypes, customerCategories, energyTypes, weekNumbers, transferredStatus, coverageTypes };
  }, [rawData]);

  const {
    filteredData,
    trendFilteredData,
    currentWeekData,
    previousWeekData,
    prePreviousWeekData,
    selectedWeeks,
    currentWeekNumber,
    previousWeekNumber,
    availableWeeks,
  } = useFilteredData(rawData, filters, timePeriod);

  const { kpiData, chartData, cumulativeBaselineRows } = useKpiData({
    timePeriod,
    filteredData,
    trendFilteredData,
    currentWeekData,
    previousWeekData,
    selectedWeeks,
    currentWeekNumber,
  });

  const value = {
    rawData,
    setRawData,
    timePeriod,
    setTimePeriod,
    filteredData,
    trendFilteredData,
    currentWeekData,
    previousWeekData,
    prePreviousWeekData,
    selectedWeeks,
    currentWeekNumber,
    previousWeekNumber,
    availableWeeks,
    filters,
    setFilters,
    filterOptions,
    kpiData,
    chartData,
    cumulativeBaselineRows,
    highlightedKpis,
    setHighlightedKpis,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
