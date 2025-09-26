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
    businessTypes: [],
    newEnergyStatus: [],
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
     const businessTypes = [...new Set(rawData.map(row => row.business_type_category))].sort();
     const newEnergyStatus = [...new Set(rawData.map(row => row.is_new_energy_vehicle))].sort();
     return { years, regions, insuranceTypes, businessTypes, newEnergyStatus };
  }, [rawData]);

  useEffect(() => {
    const newFilteredData = rawData.filter(row => {
      const yearMatch = !filters.year || row.policy_start_year.toString() === filters.year;
      const regionMatch = filters.regions.length === 0 || filters.regions.includes(row.third_level_organization);
      const typeMatch = filters.insuranceTypes.length === 0 || filters.insuranceTypes.includes(row.insurance_type);
      const businessTypeMatch = filters.businessTypes.length === 0 || filters.businessTypes.includes(row.business_type_category);
      const newEnergyStatusMatch = filters.newEnergyStatus.length === 0 || filters.newEnergyStatus.includes(row.is_new_energy_vehicle);
      return yearMatch && regionMatch && typeMatch && businessTypeMatch && newEnergyStatusMatch;
    });
    setFilteredData(newFilteredData);
    setKpiData(calculateKPIs(newFilteredData));
    setChartData(aggregateChartData(newFilteredData));
  }, [filters, rawData]);

   useEffect(() => {
    if (rawData.length > 0 && filterOptions.years.length > 0) {
      const latestYear = filterOptions.years[0];
      if (filters.year !== latestYear) {
         setFilters(f => ({ ...f, year: latestYear, regions: [], insuranceTypes: [], businessTypes: [], newEnergyStatus: [] }));
      }
    }
  }, [rawData, filterOptions.years]);

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
