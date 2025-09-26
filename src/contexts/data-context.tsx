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
    region: null,
    insuranceTypes: [],
    businessTypes: [],
    newEnergyStatus: [],
    weekNumber: null,
    transferredStatus: [],
    coverageTypes: [],
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
     const weekNumbers = [...new Set(rawData.map(row => row.week_number.toString()))].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
     const transferredStatus = [...new Set(rawData.map(row => row.is_transferred_vehicle))].sort();
     const coverageTypes = [...new Set(rawData.map(row => row.coverage_type))].sort();
     return { years, regions, insuranceTypes, businessTypes, newEnergyStatus, weekNumbers, transferredStatus, coverageTypes };
  }, [rawData]);

  useEffect(() => {
    const newFilteredData = rawData.filter(row => {
      const yearMatch = !filters.year || row.policy_start_year.toString() === filters.year;
      const regionMatch = !filters.region || row.third_level_organization === filters.region;
      const weekNumberMatch = !filters.weekNumber || row.week_number.toString() === filters.weekNumber;
      
      const typeMatch = (filters.insuranceTypes?.length || 0) === 0 || filters.insuranceTypes?.includes(row.insurance_type);
      const businessTypeMatch = (filters.businessTypes?.length || 0) === 0 || filters.businessTypes?.includes(row.business_type_category);
      const newEnergyStatusMatch = (filters.newEnergyStatus?.length || 0) === 0 || filters.newEnergyStatus?.includes(row.is_new_energy_vehicle);
      const transferredStatusMatch = (filters.transferredStatus?.length || 0) === 0 || filters.transferredStatus?.includes(row.is_transferred_vehicle);
      const coverageTypeMatch = (filters.coverageTypes?.length || 0) === 0 || filters.coverageTypes?.includes(row.coverage_type);
      
      return yearMatch && regionMatch && weekNumberMatch && typeMatch && businessTypeMatch && newEnergyStatusMatch && transferredStatusMatch && coverageTypeMatch;
    });
    setFilteredData(newFilteredData);
    setKpiData(calculateKPIs(newFilteredData));
    setChartData(aggregateChartData(newFilteredData));
  }, [filters, rawData]);

   useEffect(() => {
    if (rawData.length > 0 && filterOptions.years.length > 0) {
      const latestYear = filterOptions.years[0];
      if (filters.year !== latestYear) {
         setFilters(f => ({ ...f, year: latestYear, region: null, weekNumber: null, businessTypes: [], insuranceTypes: [], newEnergyStatus: [], transferredStatus: [], coverageTypes: [] }));
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
