'use client';

import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import type { Trade } from '@/lib/types';
import { format } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';
import { useLanguage } from '@/context/language-context';
import { enUS, es, fr, de } from 'date-fns/locale';

type PerformanceChartProps = {
  trades: Trade[];
  startingBalance: number;
};

const chartConfig = {
  equity: {
    label: 'Equity',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const dateLocaleMap = {
  en: enUS,
  es: es,
  fr: fr,
  de: de,
};

export default function PerformanceChart({ trades, startingBalance }: PerformanceChartProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const dateLocale = dateLocaleMap[language] || enUS;

  const chartData = useMemo(() => {
    if (trades.length < 1) return [{ date: t('start'), equity: startingBalance }];
    
    const sortedTrades = [...trades]
        .filter(trade => trade.exitDate && trade.exitPrice) 
        .map(trade => ({
            ...trade,
            exitDate: new Date(trade.exitDate!),
        }))
        .sort((a, b) => a.exitDate.getTime() - b.exitDate.getTime());
    
    let cumulativePL = 0;
    const dataPoints = sortedTrades.map(trade => {
      let pl = ((trade.exitPrice ?? 0) - trade.entryPrice) * trade.quantity;
      if (trade.tradeStyle === 'Option') {
        pl *= 100;
      }
      cumulativePL += pl;
      return {
        date: format(trade.exitDate, 'MMM d', { locale: dateLocale }),
        equity: startingBalance + cumulativePL,
      };
    });

    return [{ date: t('start'), equity: startingBalance }, ...dataPoints];

  }, [trades, startingBalance, t, dateLocale]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('equityCurve')}</CardTitle>
        <CardDescription>{t('equityCurveDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 1 ? (
          <ChartContainer config={{...chartConfig, equity: { ...chartConfig.equity, label: t('equity')}}} className="h-[250px] w-full">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-equity)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-equity)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis domain={['dataMin - 100', 'dataMax + 100']} tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `$${value}`} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" labelKey="date" formatter={(value, name) => [`$${(value as number).toFixed(2)}`, t('equity')]} />}
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
            {t('equityCurvePlaceholder')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
