'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { RawDataRow } from '@/lib/types';
import { normalizeRawDataRows } from '@/lib/utils';
import { storeData, getData } from '@/lib/idb';

interface DataContextType {
  rawData: RawDataRow[];
  setRawData: (data: RawDataRow[]) => void;
  loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

/**
 * 数据存储上下文 - 专门负责原始数据管理和 IndexedDB 交互
 * 职责：
 * - 原始数据状态管理
 * - IndexedDB 数据持久化
 * - 数据归一化处理
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const [rawData, setRawDataState] = useState<RawDataRow[]>([]);
  const [loading, setLoading] = useState(true);

  // 从 IndexedDB 加载数据
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getData();
        if (data && Array.isArray(data)) {
          setRawDataState(normalizeRawDataRows(data as RawDataRow[]));
        }
      } catch (error) {
        console.error("Failed to load data from IndexedDB", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const setRawData = async (data: RawDataRow[]) => {
    setLoading(true);
    try {
      const normalizedData = normalizeRawDataRows(data);
      await storeData(normalizedData);
      setRawDataState(normalizedData);
    } catch (error) {
      console.error("Failed to save data to IndexedDB", error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    rawData,
    setRawData,
    loading,
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