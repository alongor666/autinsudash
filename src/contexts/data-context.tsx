'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { RawDataRow, Filters, FilterOptions, KPIKey, Kpi, ChartDataPoint } from '@/lib/types';
import { kpiData as defaultKpiData, filterOptions as defaultFilterOptions } from '@/lib/data';
import { calculateKPIs, aggregateChartData } from '@/lib/utils';
import { storeData, getData } from '@/lib/idb';

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
  const [rawData, setRawDataState] = useState<RawDataRow[]>([]);
  const [filteredData, setFilteredData] = useState<RawDataRow[]>([]);
  const [filters, setFilters] = useState<Filters>({
    year: null,
    region: null,
    insuranceTypes: null,
    customerCategories: null,
    newEnergyStatus: null,
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
           setRawDataState(data);
        }
      } catch (error) {
        console.error("Failed to load data from IndexedDB", error);
      }
    }
    loadData();
  }, []);

  const setRawData = (data: RawDataRow[]) => {
    storeData(data)
      .then(() => {
        setRawDataState(data);
        // Reset filters when new data is loaded to show a complete overview
        setFilters({
            year: null, region: null, insuranceTypes: null, customerCategories: null,
            newEnergyStatus: null, weekNumber: null, transferredStatus: null, coverageTypes: null,
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
     const customerCategories = [...new Set(rawData.map(row => row.customer_category_3))].sort();
     const newEnergyStatus = [...new Set(rawData.map(row => row.is_new_energy_vehicle))].sort();
     const weekNumbers = [...new Set(rawData.map(row => row.week_number.toString()))].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
     const transferredStatus = [...new Set(rawData.map(row => row.is_transferred_vehicle))].sort();
     const coverageTypes = [...new Set(rawData.map(row => row.coverage_type))].sort();
     return { years, regions, insuranceTypes, customerCategories, newEnergyStatus, weekNumbers, transferredStatus, coverageTypes };
  }, [rawData]);

  useEffect(() => {
    // Main filtering logic
    const newFilteredData = rawData.filter(row => {
      const yearMatch = !filters.year || row.policy_start_year.toString() === filters.year;
      const weekNumberMatch = !filters.weekNumber || row.week_number.toString() === filters.weekNumber;

      const regionMatch = !filters.region || filters.region.includes(row.third_level_organization);
      const typeMatch = !filters.insuranceTypes || filters.insuranceTypes.includes(row.insurance_type);
      const customerCategoryMatch = !filters.customerCategories || filters.customerCategories.includes(row.customer_category_3);
      const newEnergyStatusMatch = !filters.newEnergyStatus || filters.newEnergyStatus.includes(row.is_new_energy_vehicle);
      const transferredStatusMatch = !filters.transferredStatus || filters.transferredStatus.includes(row.is_transferred_vehicle);
      const coverageTypeMatch = !filters.coverageTypes || filters.coverageTypes.includes(row.coverage_type);

      if (Array.isArray(filters.region) && filters.region.length === 0) return false;
      if (Array.isArray(filters.insuranceTypes) && filters.insuranceTypes.length === 0) return false;
      if (Array.isArray(filters.customerCategories) && filters.customerCategories.length === 0) return false;
      if (Array.isArray(filters.newEnergyStatus) && filters.newEnergyStatus.length === 0) return false;
      if (Array.isArray(filters.transferredStatus) && filters.transferredStatus.length === 0) return false;
      if (Array.isArray(filters.coverageTypes) && filters.coverageTypes.length === 0) return false;

      return yearMatch && regionMatch && weekNumberMatch && typeMatch && customerCategoryMatch && newEnergyStatusMatch && transferredStatusMatch && coverageTypeMatch;
    });

    setFilteredData(newFilteredData);
    
    // Logic for comparison data
    let previousWeekData: RawDataRow[] = [];
    if (filters.weekNumber) {
        const currentWeek = parseInt(filters.weekNumber, 10);
        const previousWeek = currentWeek - 1;
        if (previousWeek > 0) {
            // Get data for the previous week, applying all other filters except week number
            previousWeekData = rawData.filter(row => {
                const yearMatch = !filters.year || row.policy_start_year.toString() === filters.year;
                const weekMatch = row.week_number === previousWeek;

                const regionMatch = !filters.region || filters.region.includes(row.third_level_organization);
                const typeMatch = !filters.insuranceTypes || filters.insuranceTypes.includes(row.insurance_type);
                const customerCategoryMatch = !filters.customerCategories || filters.customerCategories.includes(row.customer_category_3);
                const newEnergyStatusMatch = !filters.newEnergyStatus || filters.newEnergyStatus.includes(row.is_new_energy_vehicle);
                const transferredStatusMatch = !filters.transferredStatus || filters.transferredStatus.includes(row.is_transferred_vehicle);
                const coverageTypeMatch = !filters.coverageTypes || filters.coverageTypes.includes(row.coverage_type);
                
                return yearMatch && weekMatch && regionMatch && typeMatch && customerCategoryMatch && newEnergyStatusMatch && transferredStatusMatch && coverageTypeMatch;
            });
        }
    }

    setKpiData(calculateKPIs(newFilteredData, previousWeekData));
    setChartData(aggregateChartData(newFilteredData));
  }, [filters, rawData]);

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
