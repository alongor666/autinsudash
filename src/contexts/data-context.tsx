'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { RawDataRow, Filters, FilterOptions, KPIKey, Kpi, ChartDataPoint } from '@/lib/types';
import { kpiData as defaultKpiData, filterOptions as defaultFilterOptions } from '@/lib/data';
import { calculateKPIs, aggregateChartData } from '@/lib/utils';

interface DataContextType {
  rawData: RawDataRow[];
  setRawData: (data: RawDataRow[]) => void;
  filteredData: RawDataRow[];
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
  const [rawData, setRawData] = useState<RawDataRow[]>([]);
  const [filteredData, setFilteredData] = useState<RawDataRow[]>([]);
  const [filters, setFilters] = useState<Filters>({
    year: null,
    regions: [],
    insuranceTypes: [],
  });
  const [kpiData, setKpiData] = useState(defaultKpiData);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [highlightedKpis, setHighlightedKpis] = useState<string[]>([]);

  const filterOptions = useMemo(() => {
     if (rawData.length === 0) {
        return defaultFilterOptions;
     }
     const years = [...new Set(rawData.map(row => row.policy_start_year.toString()))].sort((a,b) => b.localeCompare(a));
     const regions = [...new Set(rawData.map(row => row.third_level_organization))].sort();
     const insuranceTypes = [...new Set(rawData.map(row => row.insurance_type))].sort();
     return { years, regions, insuranceTypes };
  }, [rawData]);

  useEffect(() => {
    const newFilteredData = rawData.filter(row => {
      const yearMatch = !filters.year || row.policy_start_year.toString() === filters.year;
      const regionMatch = filters.regions.length === 0 || filters.regions.includes(row.third_level_organization);
      const typeMatch = filters.insuranceTypes.length === 0 || filters.insuranceTypes.includes(row.insurance_type);
      return yearMatch && regionMatch && typeMatch;
    });
    setFilteredData(newFilteredData);
    setKpiData(calculateKPIs(newFilteredData));
    setChartData(aggregateChartData(newFilteredData));
  }, [filters, rawData]);

   useEffect(() => {
    if (rawData.length > 0 && !filters.year) {
      setFilters(f => ({ ...f, year: filterOptions.years[0] }));
    }
  }, [rawData, filterOptions.years, filters.year]);

  const value = {
    rawData,
    setRawData,
    filteredData,
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
