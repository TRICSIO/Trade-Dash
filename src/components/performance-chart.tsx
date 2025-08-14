'use client';

import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import type { Trade } from '@/lib/types';
import { format } from 'date-fns';

type PerformanceChartProps = {
  trades: Trade[];
};

const chartConfig = {
  equity: {
    label: 'Equity',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export default function PerformanceChart({ trades }: PerformanceChartProps) {
  const chartData = useMemo(() => {
    if (trades.length < 2) return [];
    
    const sortedTrades = [...trades]
        .map(trade => ({
            ...trade,
            exitDate: new Date(trade.exitDate),
        }))
        .sort((a, b) => a.exitDate.getTime() - b.exitDate.getTime());
    
    let cumulativePL = 0;
    return sortedTrades.map(trade => {
      const pl = (trade.exitPrice - trade.entryPrice) * trade.quantity;
      cumulativePL += pl;
      return {
        date: format(trade.exitDate, 'MMM d'),
        equity: cumulativePL,
      };
    });
  }, [trades]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equity Curve</CardTitle>
        <CardDescription>Your portfolio value over time.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-equity)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-equity)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `$${value}`} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" labelKey="equity" />}
              />
              <Area
                dataKey="equity"
                type="natural"
                fill="url(#fillEquity)"
                stroke="var(--color-equity)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground">
            Log at least two trades to see your equity curve.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
