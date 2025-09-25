'use client';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { chartData } from '@/lib/data';

const chartConfig = {
  保费: {
    label: '保费',
    color: 'hsl(var(--primary))',
  },
  赔付: {
    label: '赔付',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;

export function MainChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>保费与赔付趋势</CardTitle>
        <CardDescription>最近6个月</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              tickFormatter={(value) => `¥${Number(value) / 1000}k`}
              stroke="hsl(var(--muted-foreground))"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="保费" fill="var(--color-保费)" radius={4} />
            <Bar dataKey="赔付" fill="var(--color-赔付)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
