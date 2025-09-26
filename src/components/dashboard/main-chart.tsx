'use client';
import { Bar, CartesianGrid, XAxis, YAxis, Legend, Line, ComposedChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useData } from '@/contexts/data-context';

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
  const { chartData } = useData();

  return (
    <Card>
      <CardHeader>
        <CardTitle>核心指标趋势</CardTitle>
        <CardDescription>按周汇总</CardDescription>
      </CardHeader>
      <CardContent>
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
              tickFormatter={(value) => `${Number(value) / 10000}万`}
              stroke="hsl(var(--muted-foreground))"
            />
             <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => `${Number(value) / 10000}万`}
              stroke="hsl(var(--muted-foreground))"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Legend />
            <Bar dataKey="signed_premium_yuan" name="签单保费" fill="var(--color-signed_premium_yuan)" radius={4} yAxisId="left" />
            <Line dataKey="reported_claim_payment_yuan" name="已报告赔款" type="monotone" stroke="var(--color-reported_claim_payment_yuan)" strokeWidth={2} dot={false} yAxisId="right" />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
