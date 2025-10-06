'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { RawDataRow, Filters, FilterOptions, KPIKey, Kpi, ChartDataPoint } from '@/lib/types';
import { kpiData as defaultKpiData, filterOptions as defaultFilterOptions } from '@/lib/data';
import {
  calculateKPIs,
  aggregateChartData,
  normalizeRawDataRows,
  sortByPreferredOrder,
  ENERGY_TYPE_ORDER,
  TRANSFER_STATUS_ORDER,
} from '@/lib/utils';
import { storeData, getData } from '@/lib/idb';

interface DataContextType {
  rawData: RawDataRow[];
  setRawData: (data: RawDataRow[]) => void;
  filteredData: RawDataRow[];
  trendFilteredData: RawDataRow[];
  filters: Filters;
  setFilters: (filters: Filters) => void;
  filterOptions: FilterOptions;
  kpiData: { [key in KPIKey]: Omit<Kpi, 'title' | 'id'> };
  chartData: ChartDataPoint[];
  highlightedKpis: string[];
  setHighlightedKpis: (kpis: string[]) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [rawData, setRawDataState] = useState<RawDataRow[]>([]);
  const [filteredData, setFilteredData] = useState<RawDataRow[]>([]);
  const [trendFilteredData, setTrendFilteredData] = useState<RawDataRow[]>([]);
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
  const [kpiData, setKpiData] = useState(defaultKpiData);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
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

  const setRawData = (data: RawDataRow[]) => {
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
  };


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

  useEffect(() => {
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

      if (Array.isArray(filters.region) && filters.region.length === 0) return false;
      if (Array.isArray(filters.insuranceTypes) && filters.insuranceTypes.length === 0) return false;
      if (Array.isArray(filters.businessTypes) && filters.businessTypes.length === 0) return false;
      if (Array.isArray(filters.customerCategories) && filters.customerCategories.length === 0) return false;
      if (Array.isArray(filters.energyTypes) && filters.energyTypes.length === 0) return false;
      if (Array.isArray(filters.transferredStatus) && filters.transferredStatus.length === 0) return false;
      if (Array.isArray(filters.coverageTypes) && filters.coverageTypes.length === 0) return false;

      return yearMatch && regionMatch && typeMatch && businessTypeMatch && customerCategoryMatch && energyTypesMatch && transferredStatusMatch && coverageTypeMatch;
    };

    const matchedRows: RawDataRow[] = [];
    const matchedWeeks = new Set<string>();

    rawData.forEach((row) => {
      if (!matchesCommonFilters(row)) {
        return;
      }
      matchedRows.push(row);
      matchedWeeks.add(row.week_number.toString());
    });

    const matchedWeekList = Array.from(matchedWeeks).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    const effectiveGeneralWeeks = sortedSelectedWeeks
      ? (sortedSelectedWeeks.length > 1
        ? [sortedSelectedWeeks[sortedSelectedWeeks.length - 1]]
        : sortedSelectedWeeks)
      : (matchedWeekList.length ? [matchedWeekList[matchedWeekList.length - 1]] : null);

    const nextFilteredData: RawDataRow[] = effectiveGeneralWeeks
      ? matchedRows.filter((row) => effectiveGeneralWeeks.includes(row.week_number.toString()))
      : [];

    const nextTrendFilteredData: RawDataRow[] = matchedRows.filter((row) => {
      if (!sortedSelectedWeeks) {
        return true;
      }
      return sortedSelectedWeeks.includes(row.week_number.toString());
    });

    setFilteredData(nextFilteredData);
    setTrendFilteredData(nextTrendFilteredData);

    let previousWeekData: RawDataRow[] = [];
    const latestEffectiveWeek = effectiveGeneralWeeks?.[effectiveGeneralWeeks.length - 1];
    if (latestEffectiveWeek) {
      const currentWeekNumber = parseInt(latestEffectiveWeek, 10);
      const previousWeekNumber = currentWeekNumber - 1;
      if (previousWeekNumber > 0) {
        previousWeekData = matchedRows.filter((row) => row.week_number === previousWeekNumber);
      }
    }

    setKpiData(calculateKPIs(nextFilteredData, previousWeekData));
    setChartData(aggregateChartData(nextTrendFilteredData));
  }, [filters, rawData]);

  const value = {
    rawData,
    setRawData,
    filteredData,
    trendFilteredData,
    filters,
    setFilters,
    filterOptions,
    kpiData,
    chartData,
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
