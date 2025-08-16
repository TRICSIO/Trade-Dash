'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import type { Trade } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import { ChartContainer } from './ui/chart';

type StyleDistributionChartProps = {
  trades: Trade[];
};

const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

export default function StyleDistributionChart({ trades }: StyleDistributionChartProps) {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    if (trades.length === 0) return [];

    const styleCounts = trades.reduce((acc, trade) => {
      acc[trade.tradeStyle] = (acc[trade.tradeStyle] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(styleCounts).map(([name, value]) => ({
      name: t(name.toLowerCase().replace(' ', '') as any) || name,
      value,
    }));
  }, [trades, t]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>{t('styleDistribution')}</CardTitle>
        <CardDescription>{t('styleDistributionDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center">
        {chartData.length > 0 ? (
           <ChartContainer config={{}} className="h-[250px] w-full">
             <PieChart>
                <Tooltip
                    cursor={false}
                    formatter={(value, name) => [`${((Number(value) / trades.length) * 100).toFixed(1)}% (${value})`, name]}
                />
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                    {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
            </PieChart>
           </ChartContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground p-4 text-center">
            {t('styleDistributionPlaceholder')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
