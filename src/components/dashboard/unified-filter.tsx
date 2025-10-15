'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '@/contexts/data-context';
import type { Filters } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  RotateCcw, 
  Check,
  X
} from 'lucide-react';
// 说明：原先使用的 SheetHeader/SheetTitle 依赖 Radix Dialog 上下文，
// 在非 Sheet 场景（如设置菜单内直接渲染）会触发“DialogTitle must be used within Dialog”错误。
// 改为使用普通元素以避免上下文依赖，同时保持样式一致。

interface UnifiedFilterProps {
  onClose: () => void;
}

/**
 * 统一筛选组件 - 极简设计
 * 
 * 设计原则：
 * 1. 单一入口：整合所有筛选功能
 * 2. 智能分层：高频筛选优先，低频筛选折叠
 * 3. 即时反馈：草稿模式 + 实时预览
 * 4. 零冗余：复用现有状态管理
 */
export function UnifiedFilter({ onClose }: UnifiedFilterProps) {
  const { rawData, filterOptions, filters, setFilters } = useData();
  const { toast } = useToast();
  
  // 草稿状态管理
  const [draftFilters, setDraftFilters] = useState<Filters>(filters);
  
  // 展开状态管理
  const [expandedSections, setExpandedSections] = useState({
    advanced: false,
  });

  // 同步外部筛选状态到草稿
  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  const businessTypeOrder = useMemo(() => filterOptions.businessTypes || [], [filterOptions.businessTypes]);
  const transferStatusOrder = useMemo(() => filterOptions.transferredStatus || [], [filterOptions.transferredStatus]);

  const customerBusinessMapping = useMemo(() => {
    const mapping = new Map<string, Set<string>>();

    rawData.forEach((row) => {
      const customer = (row.customer_category_3 || '').trim();
      const business = (row.business_type_category || '').trim();
      if (!customer || !business) return;
      if (!mapping.has(customer)) {
        mapping.set(customer, new Set<string>());
      }
      mapping.get(customer)!.add(business);
    });

    return mapping;
  }, [rawData]);

  const availableTransferredStatus = useMemo(() => {
    const selectedRenewal = draftFilters.renewalStatuses?.filter(Boolean) ?? [];
    if (selectedRenewal.some((status) => status === '新保' || status === '续保')) {
      return transferStatusOrder.filter((status) => status !== '过户');
    }
    return transferStatusOrder;
  }, [draftFilters.renewalStatuses, transferStatusOrder]);

  const availableBusinessTypes = useMemo(() => {
    if (businessTypeOrder.length === 0) {
      return [];
    }

    const selectedCustomers = draftFilters.customerCategories?.filter(Boolean) ?? [];
    const selectedTransferStatuses = draftFilters.transferredStatus?.filter(Boolean) ?? [];
    const selectedRenewalStatuses = draftFilters.renewalStatuses?.filter(Boolean) ?? [];

    let candidateSet = new Set<string>(businessTypeOrder);

    if (selectedCustomers.length > 0) {
      const collected = new Set<string>();
      selectedCustomers.forEach((customer) => {
        const mapped = customerBusinessMapping.get(customer);
        if (mapped && mapped.size > 0) {
          mapped.forEach((type) => collected.add(type));
        }
      });
      if (collected.size > 0) {
        candidateSet = collected;
      }
    }

    if (selectedTransferStatuses.length > 0) {
      const next = new Set<string>();
      candidateSet.forEach((type) => {
        let allow = true;
        if (selectedTransferStatuses.includes('过户')) {
          if (type.includes('新车') || type.includes('非过户')) {
            allow = false;
          }
        }
        if (allow && selectedTransferStatuses.includes('非过户')) {
          if (type.includes('过户') && !type.includes('非过户')) {
            allow = false;
          }
        }
        if (allow) {
          next.add(type);
        }
      });
      candidateSet = next;
    }

    if (selectedRenewalStatuses.length > 0) {
      const next = new Set<string>();
      candidateSet.forEach((type) => {
        let allow = true;
        if (selectedRenewalStatuses.includes('新保')) {
          if (type.includes('旧车') || type.includes('非过户')) {
            allow = false;
          }
        }
        if (allow && selectedRenewalStatuses.includes('续保')) {
          const hasTransferKeyword = type.includes('过户') && !type.includes('非过户');
          if (type.includes('新车') || hasTransferKeyword) {
            allow = false;
          }
        }
        if (allow && selectedRenewalStatuses.includes('转保')) {
          if (type.includes('新车')) {
            allow = false;
          }
        }
        if (allow) {
          next.add(type);
        }
      });
      candidateSet = next;
    }

    if (candidateSet.size === 0) {
      return [];
    }

    return businessTypeOrder.filter((type) => candidateSet.has(type));
  }, [
    businessTypeOrder,
    draftFilters.customerCategories,
    draftFilters.transferredStatus,
    draftFilters.renewalStatuses,
    customerBusinessMapping,
  ]);

  const areStringArraysEqual = useCallback((a: string[] | null | undefined, b: string[] | null | undefined) => {
    if (a === b) return true;
    const arrA = Array.isArray(a) ? a : [];
    const arrB = Array.isArray(b) ? b : [];
    if (arrA.length !== arrB.length) return false;
    return arrA.every((value, index) => value === arrB[index]);
  }, []);

  const sanitizeDependentFilters = useCallback((input: Filters): Filters => {
    const next: Filters = { ...input };

    if (availableTransferredStatus.length > 0) {
      const allowed = new Set(availableTransferredStatus);
      const current = Array.isArray(next.transferredStatus) ? next.transferredStatus.filter(Boolean) : [];
      const sanitized = current.filter((status) => allowed.has(status));
      next.transferredStatus = sanitized.length > 0 ? sanitized : null;
    } else {
      next.transferredStatus = null;
    }

    if (availableBusinessTypes.length > 0) {
      const allowed = new Set(availableBusinessTypes);
      const current = Array.isArray(next.businessTypes) ? next.businessTypes.filter(Boolean) : [];
      const sanitized = current.filter((type) => allowed.has(type));
      next.businessTypes = sanitized.length > 0 ? sanitized : null;
    } else {
      next.businessTypes = null;
    }

    return next;
  }, [availableTransferredStatus, availableBusinessTypes]);

  useEffect(() => {
    setDraftFilters((prev) => {
      const sanitized = sanitizeDependentFilters(prev);
      const transferUnchanged = areStringArraysEqual(prev.transferredStatus, sanitized.transferredStatus);
      const businessUnchanged = areStringArraysEqual(prev.businessTypes, sanitized.businessTypes);
      if (transferUnchanged && businessUnchanged) {
        return prev;
      }
      return sanitized;
    });
  }, [availableBusinessTypes, availableTransferredStatus, draftFilters.transferredStatus, draftFilters.businessTypes, sanitizeDependentFilters, areStringArraysEqual]);

  const computeFilterStats = (target: Filters) => {
    let activeCount = 0;
    let totalFilters = 0;

    Object.entries(target).forEach(([key, value]) => {
      if (key === 'year' || key === 'weekNumber') {
        totalFilters++;
        if (value !== null) activeCount++;
      } else if (Array.isArray(value)) {
        totalFilters++;
        if (value.length > 0) activeCount++;
      } else if (value !== null) {
        totalFilters++;
        activeCount++;
      }
    });

    return { activeCount, totalFilters };
  };

  // 计算筛选统计
  const filterStats = useMemo(() => computeFilterStats(draftFilters), [draftFilters]);

  // 年度筛选处理
  const handleYearChange = (value: string) => {
    setDraftFilters(prev => ({ ...prev, year: value === 'all' ? null : value }));
  };

  // 周序号筛选处理
  const handleWeekChange = (value: string) => {
    setDraftFilters(prev => ({ 
      ...prev, 
      weekNumber: value === 'all' ? null : [value] 
    }));
  };

  // 地区筛选处理
  const handleRegionChange = (value: string, checked: boolean) => {
    const regionOptions = filterOptions.regions || [];
    const currentRaw = draftFilters.region;
    const current = Array.isArray(currentRaw) ? currentRaw : regionOptions;

    const updated = checked
      ? Array.from(new Set([...current, value]))
      : current.filter((item) => item !== value);

    const sanitized = updated.filter((item) => regionOptions.includes(item));
    const sorted = sanitized.sort((a, b) => regionOptions.indexOf(a) - regionOptions.indexOf(b));

    setDraftFilters(prev => ({
      ...prev,
      region: sorted.length === regionOptions.length ? null : sorted
    }));
  };

  // 多选筛选处理（通用）
  const handleMultiSelectChange = (
    filterKey: keyof Filters,
    value: string,
    checked: boolean,
    options: string[]
  ) => {
    const currentRaw = draftFilters[filterKey];
    const current = Array.isArray(currentRaw) ? currentRaw : options;

    const updated = checked
      ? Array.from(new Set([...current, value]))
      : current.filter((item) => item !== value);

    const sanitized = updated.filter((item) => options.includes(item));

    setDraftFilters(prev => ({
      ...prev,
      [filterKey]: sanitized.length === options.length ? null : sanitized
    }));
  };

  // 快速操作
  const selectAll = (filterKey: keyof Filters) => {
    setDraftFilters(prev => ({ ...prev, [filterKey]: null }));
  };

  const clearAll = (filterKey: keyof Filters) => {
    setDraftFilters(prev => ({ ...prev, [filterKey]: [] }));
  };

  const invertSelection = (filterKey: keyof Filters, options: string[]) => {
    const currentRaw = draftFilters[filterKey];
    const current = Array.isArray(currentRaw) ? currentRaw : options;
    const inverted = options.filter(item => !current.includes(item));
    
    setDraftFilters(prev => ({
      ...prev,
      [filterKey]: inverted.length === options.length ? null : inverted
    }));
  };

  // 应用筛选
  const applyFilters = () => {
    const sanitized = sanitizeDependentFilters(draftFilters);
    setDraftFilters(sanitized);
    setFilters(sanitized);
    const sanitizedStats = computeFilterStats(sanitized);
    toast({
      title: '筛选已应用',
      description: `已应用 ${sanitizedStats.activeCount} 个筛选条件`,
    });
    onClose();
  };

  // 重置筛选
  const resetFilters = () => {
    const resetState: Filters = {
      year: null,
      region: null,
      insuranceTypes: null,
      businessTypes: null,
      customerCategories: null,
      energyTypes: null,
      renewalStatuses: null,
      weekNumber: null,
      transferredStatus: null,
      coverageTypes: null,
    };
    setDraftFilters(resetState);
  };

  // 获取选中状态
  const getSelectedItems = (filterKey: keyof Filters, options: string[]) => {
    const value = draftFilters[filterKey];
    return Array.isArray(value) ? new Set(value) : new Set(options);
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* 头部 */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
              <Filter className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">统一筛选</h2>
              <p className="text-xs text-muted-foreground">
                {filterStats.activeCount} / {filterStats.totalFilters} 个筛选条件已激活
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 p-6">
          {/* 高频筛选区域 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">高频筛选</Badge>
            </div>

            {/* 年度筛选 */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">年度</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleYearChange('all')}
                  className={`h-8 text-xs ${draftFilters.year === null ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white' : ''}`}
                >
                  全部年度
                </Button>
                {filterOptions.years?.map((year) => (
                  <Button
                    key={year}
                    variant="outline"
                    size="sm"
                    onClick={() => handleYearChange(year)}
                    className={`h-8 text-xs ${draftFilters.year === year ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white' : ''}`}
                  >
                    {year}
                  </Button>
                ))}
              </div>
            </div>

            {/* 周序号筛选 */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">周序号</Label>
              <Select 
                onValueChange={handleWeekChange} 
                value={
                  draftFilters.weekNumber === null 
                    ? 'all' 
                    : Array.isArray(draftFilters.weekNumber) && draftFilters.weekNumber.length === 1
                      ? draftFilters.weekNumber[0]
                      : 'all'
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择周序号" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  <SelectItem value="all">全部周</SelectItem>
                  {filterOptions.weekNumbers?.map((week) => (
                    <SelectItem key={week} value={week}>第 {week} 周</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 地区筛选 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">三级机构</Label>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectAll('region')}
                    className="h-6 px-2 text-xs"
                  >
                    全选
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearAll('region')}
                    className="h-6 px-2 text-xs"
                  >
                    清空
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => invertSelection('region', filterOptions.regions || [])}
                    className="h-6 px-2 text-xs"
                  >
                    反选
                  </Button>
                </div>
              </div>
              <div className="max-h-[200px] space-y-2 overflow-y-auto rounded-md border p-3">
                {filterOptions.regions?.map((region) => {
                  const selectedRegions = getSelectedItems('region', filterOptions.regions || []);
                  const isChecked = selectedRegions.has(region);
                  return (
                    <div key={region} className="flex items-center space-x-2">
                      <Checkbox
                        id={`region-${region}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => 
                          handleRegionChange(region, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`region-${region}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {region}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <Separator />

          {/* 高级筛选区域 */}
          <Collapsible
            open={expandedSections.advanced}
            onOpenChange={(open) => 
              setExpandedSections(prev => ({ ...prev, advanced: open }))
            }
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">高级筛选</Badge>
                  <span className="text-sm text-muted-foreground">
                    更多筛选维度
                  </span>
                </div>
                {expandedSections.advanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4 pt-4">
              {/* 险种类型 */}
              {filterOptions.insuranceTypes && filterOptions.insuranceTypes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">险种类型</Label>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectAll('insuranceTypes')}
                        className="h-6 px-2 text-xs"
                      >
                        全选
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearAll('insuranceTypes')}
                        className="h-6 px-2 text-xs"
                      >
                        清空
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-[150px] space-y-2 overflow-y-auto rounded-md border p-3">
                    {filterOptions.insuranceTypes.map((type) => {
                      const selectedTypes = getSelectedItems('insuranceTypes', filterOptions.insuranceTypes || []);
                      const isChecked = selectedTypes.has(type);
                      return (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`insurance-${type}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => 
                              handleMultiSelectChange('insuranceTypes', type, checked as boolean, filterOptions.insuranceTypes || [])
                            }
                          />
                          <Label
                            htmlFor={`insurance-${type}`}
                            className={`text-sm font-normal cursor-pointer ${isChecked ? 'rounded px-2 py-1 bg-blue-600 text-white' : ''}`}
                          >
                            {type}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 业务类型 */}
              {businessTypeOrder.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">业务类型</Label>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectAll('businessTypes')}
                        className="h-6 px-2 text-xs"
                      >
                        全选
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearAll('businessTypes')}
                        className="h-6 px-2 text-xs"
                      >
                        清空
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-[150px] space-y-2 overflow-y-auto rounded-md border p-3">
                    {availableBusinessTypes.length === 0 ? (
                      <div className="text-xs text-muted-foreground">暂无可用业务类型，请调整其他筛选条件</div>
                    ) : (
                      availableBusinessTypes.map((type) => {
                        const selectedTypes = getSelectedItems('businessTypes', availableBusinessTypes);
                        const isChecked = selectedTypes.has(type);
                        return (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox
                              id={`business-${type}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => 
                                handleMultiSelectChange('businessTypes', type, checked as boolean, availableBusinessTypes)
                              }
                            />
                            <Label
                              htmlFor={`business-${type}`}
                              className={`text-sm font-normal cursor-pointer ${isChecked ? 'rounded px-2 py-1 bg-blue-600 text-white' : ''}`}
                            >
                              {type}
                            </Label>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* 客户类别 */}
              {filterOptions.customerCategories && filterOptions.customerCategories.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">客户类别</Label>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectAll('customerCategories')}
                        className="h-6 px-2 text-xs"
                      >
                        全选
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearAll('customerCategories')}
                        className="h-6 px-2 text-xs"
                      >
                        清空
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-[150px] space-y-2 overflow-y-auto rounded-md border p-3">
                    {filterOptions.customerCategories.map((category) => {
                      const selectedCategories = getSelectedItems('customerCategories', filterOptions.customerCategories || []);
                      const isChecked = selectedCategories.has(category);
                      return (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={`customer-${category}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => 
                              handleMultiSelectChange('customerCategories', category, checked as boolean, filterOptions.customerCategories || [])
                            }
                          />
                          <Label
                            htmlFor={`customer-${category}`}
                            className={`text-sm font-normal cursor-pointer ${isChecked ? 'rounded px-2 py-1 bg-blue-600 text-white' : ''}`}
                          >
                            {category}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 新能源类型 */}
              {filterOptions.energyTypes && filterOptions.energyTypes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">能源类型</Label>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectAll('energyTypes')}
                        className="h-6 px-2 text-xs"
                      >
                        全选
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearAll('energyTypes')}
                        className="h-6 px-2 text-xs"
                      >
                        清空
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.energyTypes.map((type) => {
                      const selectedTypes = getSelectedItems('energyTypes', filterOptions.energyTypes || []);
                      const isChecked = selectedTypes.has(type);
                      return (
                        <Button
                          key={type}
                          variant="outline"
                          size="sm"
                          onClick={() => 
                            handleMultiSelectChange('energyTypes', type, !isChecked, filterOptions.energyTypes || [])
                          }
                          className={`h-8 text-xs ${isChecked ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white' : ''}`}
                        >
                          {type}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 续保状态 */}
              {filterOptions.renewalStatuses && filterOptions.renewalStatuses.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">续保状态</Label>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectAll('renewalStatuses')}
                        className="h-6 px-2 text-xs"
                      >
                        全选
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearAll('renewalStatuses')}
                        className="h-6 px-2 text-xs"
                      >
                        清空
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.renewalStatuses.map((status) => {
                      const selectedStatuses = getSelectedItems('renewalStatuses', filterOptions.renewalStatuses || []);
                      const isChecked = selectedStatuses.has(status);
                      return (
                        <Button
                          key={status}
                          variant="outline"
                          size="sm"
                          onClick={() => 
                            handleMultiSelectChange('renewalStatuses', status, !isChecked, filterOptions.renewalStatuses || [])
                          }
                          className={`h-8 text-xs ${isChecked ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white' : ''}`}
                        >
                          {status}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 过户状态 */}
              {availableTransferredStatus && availableTransferredStatus.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">过户状态</Label>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectAll('transferredStatus')}
                        className="h-6 px-2 text-xs"
                      >
                        全选
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearAll('transferredStatus')}
                        className="h-6 px-2 text-xs"
                      >
                        清空
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableTransferredStatus.map((status) => {
                      const selectedStatuses = getSelectedItems('transferredStatus', availableTransferredStatus);
                      const isChecked = selectedStatuses.has(status);
                      return (
                        <Button
                          key={status}
                          variant="outline"
                          size="sm"
                          onClick={() => 
                            handleMultiSelectChange('transferredStatus', status, !isChecked, availableTransferredStatus)
                          }
                          className={`h-8 text-xs ${isChecked ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white' : ''}`}
                        >
                          {status}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 保障类型 */}
              {filterOptions.coverageTypes && filterOptions.coverageTypes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">保障类型</Label>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectAll('coverageTypes')}
                        className="h-6 px-2 text-xs"
                      >
                        全选
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearAll('coverageTypes')}
                        className="h-6 px-2 text-xs"
                      >
                        清空
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-[150px] space-y-2 overflow-y-auto rounded-md border p-3">
                    {filterOptions.coverageTypes.map((type) => {
                      const selectedTypes = getSelectedItems('coverageTypes', filterOptions.coverageTypes || []);
                      const isChecked = selectedTypes.has(type);
                      return (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`coverage-${type}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => 
                              handleMultiSelectChange('coverageTypes', type, checked as boolean, filterOptions.coverageTypes || [])
                            }
                          />
                          <Label
                            htmlFor={`coverage-${type}`}
                            className={`text-sm font-normal cursor-pointer ${isChecked ? 'rounded px-2 py-1 bg-blue-600 text-white' : ''}`}
                          >
                            {type}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>

      {/* 底部操作栏 */}
      <div className="border-t bg-gray-50/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={resetFilters}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            重置
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button onClick={applyFilters} className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              应用筛选
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
