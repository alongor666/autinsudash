'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
  highlightedKpis: string[];
  setHighlightedKpis: (kpis: string[]) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

/**
 * UI状态上下文 - 专门负责界面相关状态管理
 * 职责：
 * - KPI高亮状态
 * - 加载和分析状态
 * - 侧边栏等UI组件状态
 * - 用户交互状态管理
 */
export function UIProvider({ children }: { children: ReactNode }) {
  const [highlightedKpis, setHighlightedKpis] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const value = {
    highlightedKpis,
    setHighlightedKpis,
    isAnalyzing,
    setIsAnalyzing,
    sidebarOpen,
    setSidebarOpen,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}