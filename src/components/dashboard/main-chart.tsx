'use client';
import { useMemo } from 'react';
import { Bar, CartesianGrid, XAxis, YAxis, Line, ComposedChart, LabelList } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useData } from '@/contexts/data-context';
import { formatFilterContext } from '@/lib/utils';

const chartConfig = {
  "signed_premium_yuan": {
    label: '签单保费',
    color: 'hsl(var(--chart-1))',
  },
  "reported_claim_payment_yuan": {
    label: '已报告赔款',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function MainChart() {
  const { chartData, filters } = useData();
  const filterContext = useMemo(() => formatFilterContext(filters), [filters]);
  const mainInsight = '保费规模稳步增长，赔付水平整体可控';
  const mainExplanation = '按周汇总当前筛选范围内的签单保费与已报告赔款表现。';
  const mainTitle = `周度保费与赔款趋势（${filterContext}）`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mainTitle}</CardTitle>
        <CardDescription>{mainInsight}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ComposedChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="week_number"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(value) => `W${value}`}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              tickFormatter={(value) => Math.round(Number(value) / 10000).toLocaleString("zh-CN")}
              stroke="hsl(var(--muted-foreground))"
            />
             <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => Math.round(Number(value) / 10000).toLocaleString("zh-CN")}
              stroke="hsl(var(--muted-foreground))"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="signed_premium_yuan" name="签单保费" fill="var(--color-signed_premium_yuan)" radius={4} yAxisId="left">
              <LabelList
                dataKey="signed_premium_yuan"
                position="top"
                fontSize={12}
                formatter={(value: number) => Math.round(value / 10000).toLocaleString("zh-CN")}
              />
            </Bar>
            <Line dataKey="reported_claim_payment_yuan" name="已报告赔款" type="monotone" stroke="var(--color-reported_claim_payment_yuan)" strokeWidth={2} dot={false} yAxisId="right" />
          </ComposedChart>
        </ChartContainer>
        <p className="text-sm text-muted-foreground/70">{mainExplanation}</p>
      </CardContent>
    </Card>
  );
}
