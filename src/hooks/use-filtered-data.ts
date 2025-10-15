import { useMemo } from 'react';
import type { Filters, RawDataRow, TimePeriod } from '@/lib/types';

type FilteredDataResult = {
  filteredData: RawDataRow[];
  trendFilteredData: RawDataRow[];
  currentWeekData: RawDataRow[];
  previousWeekData: RawDataRow[];
  prePreviousWeekData: RawDataRow[];
  currentWeekNumber: number | null;
  previousWeekNumber: number | null;
  prePreviousWeekNumber: number | null;
  selectedWeeks: number[];
  availableWeeks: number[];
};

function normalizeWeekSelection(weekNumber: Filters['weekNumber']): number[] {
  if (!weekNumber || !weekNumber.length) {
    return [];
  }
  return Array.from(new Set(weekNumber.map((week) => parseInt(week, 10)).filter((week) => !Number.isNaN(week)))).sort(
    (a, b) => a - b,
  );
}

function isNonEmptyArray<T>(value: T[] | null | undefined): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

export function useFilteredData(rawData: RawDataRow[], filters: Filters, timePeriod: TimePeriod): FilteredDataResult {
  return useMemo<FilteredDataResult>(() => {
    if (!rawData.length) {
      return {
        filteredData: [],
        trendFilteredData: [],
        currentWeekData: [],
        previousWeekData: [],
        prePreviousWeekData: [],
        currentWeekNumber: null,
        previousWeekNumber: null,
        prePreviousWeekNumber: null,
        selectedWeeks: [],
        availableWeeks: [],
      };
    }

    const matchesCommonFilters = (row: RawDataRow) => {
      if (isNonEmptyArray(filters.region) && !filters.region.includes(row.third_level_organization)) {
        return false;
      }
      if (isNonEmptyArray(filters.insuranceTypes) && !filters.insuranceTypes.includes(row.insurance_type)) {
        return false;
      }
      if (isNonEmptyArray(filters.businessTypes) && !filters.businessTypes.includes(row.business_type_category)) {
        return false;
      }
      if (isNonEmptyArray(filters.customerCategories) && !filters.customerCategories.includes(row.customer_category_3)) {
        return false;
      }
      if (isNonEmptyArray(filters.energyTypes) && !filters.energyTypes.includes(row.is_new_energy_vehicle)) {
        return false;
      }
      if (isNonEmptyArray(filters.transferredStatus) && !filters.transferredStatus.includes(row.is_transferred_vehicle)) {
        return false;
      }
      if (isNonEmptyArray(filters.coverageTypes) && !filters.coverageTypes.includes(row.coverage_type)) {
        return false;
      }
      if (filters.year && row.policy_start_year.toString() !== filters.year) {
        return false;
      }
      return true;
    };

    const matchedRows = rawData.filter(matchesCommonFilters);
    if (!matchedRows.length) {
      return {
        filteredData: [],
        trendFilteredData: [],
        currentWeekData: [],
        previousWeekData: [],
        prePreviousWeekData: [],
        currentWeekNumber: null,
        previousWeekNumber: null,
        prePreviousWeekNumber: null,
        selectedWeeks: [],
        availableWeeks: [],
      };
    }

    const availableWeeks = Array.from(new Set(matchedRows.map((row) => row.week_number))).sort((a, b) => a - b);
    const selectedWeeks = normalizeWeekSelection(filters.weekNumber);
    const activeWeekScope = selectedWeeks.length ? selectedWeeks : availableWeeks;
    const activeWeekSet = new Set(activeWeekScope);

    const currentWeekNumber = activeWeekScope.length ? activeWeekScope[activeWeekScope.length - 1] : null;
    const previousWeekNumber =
      currentWeekNumber !== null
        ? availableWeeks.filter((week) => week < currentWeekNumber).pop() ?? null
        : null;
    const prePreviousWeekNumber =
      previousWeekNumber !== null
        ? availableWeeks.filter((week) => week < previousWeekNumber).pop() ?? null
        : null;

    const currentWeekData =
      currentWeekNumber === null
        ? []
        : matchedRows.filter((row) => row.week_number === currentWeekNumber);
    const previousWeekData =
      previousWeekNumber === null
        ? []
        : matchedRows.filter((row) => row.week_number === previousWeekNumber);
    const prePreviousWeekData =
      prePreviousWeekNumber === null
        ? []
        : matchedRows.filter((row) => row.week_number === prePreviousWeekNumber);

    const trendFilteredData = matchedRows.filter((row) =>
      activeWeekSet.size ? activeWeekSet.has(row.week_number) : true,
    );

    const filteredData =
      timePeriod === 'weekly'
        ? currentWeekData
        : matchedRows.filter((row) =>
            activeWeekSet.size ? activeWeekSet.has(row.week_number) : row.week_number <= (currentWeekNumber ?? 0),
          );

    return {
      filteredData,
      trendFilteredData,
      currentWeekData,
      previousWeekData,
      prePreviousWeekData,
      currentWeekNumber,
      previousWeekNumber,
      prePreviousWeekNumber,
      selectedWeeks: activeWeekScope,
      availableWeeks,
    };
  }, [rawData, filters, timePeriod]);
}
