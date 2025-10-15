import { useMemo } from 'react';
import type { ChartDataPoint, RawDataRow, TimePeriod } from '@/lib/types';
import { aggregateChartData } from '@/lib/utils';
import { calculateWeeklyKPIs, calculateYearToDateKPIs } from '@/lib/kpi-calculator';

type UseKpiDataParams = {
  timePeriod: TimePeriod;
  filteredData: RawDataRow[];
  trendFilteredData: RawDataRow[];
  currentWeekData: RawDataRow[];
  previousWeekData: RawDataRow[];
  selectedWeeks: number[];
  currentWeekNumber: number | null;
};

type UseKpiDataResult = {
  kpiData: ReturnType<typeof calculateWeeklyKPIs>;
  chartData: ChartDataPoint[];
  cumulativeBaselineRows: RawDataRow[];
};

export function useKpiData({
  timePeriod,
  filteredData,
  trendFilteredData,
  currentWeekData,
  previousWeekData,
  selectedWeeks,
  currentWeekNumber,
}: UseKpiDataParams): UseKpiDataResult {
  return useMemo<UseKpiDataResult>(() => {
    const chartData = aggregateChartData(trendFilteredData, timePeriod);

    if (timePeriod === 'weekly') {
      const kpiData = calculateWeeklyKPIs(currentWeekData, previousWeekData);
      return {
        kpiData,
        chartData,
        cumulativeBaselineRows: previousWeekData,
      };
    }

    const previousWeeks =
      currentWeekNumber === null
        ? []
        : selectedWeeks.filter((week) => week < currentWeekNumber);

    const previousCumulativeRows =
      previousWeeks.length === 0
        ? []
        : trendFilteredData.filter((row) => previousWeeks.includes(row.week_number));

    const kpiData = calculateYearToDateKPIs(filteredData, previousCumulativeRows);

    return {
      kpiData,
      chartData,
      cumulativeBaselineRows: previousCumulativeRows,
    };
  }, [
    timePeriod,
    filteredData,
    trendFilteredData,
    currentWeekData,
    previousWeekData,
    selectedWeeks,
    currentWeekNumber,
  ]);
}
