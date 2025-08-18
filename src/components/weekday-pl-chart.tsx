
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import type { Trade } from '@/lib/types';
import { format, getDay } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';
import { useLanguage } from '@/context/language-context';
import { enUS, es, fr, de } from 'date-fns/locale';

type WeekdayPLChartProps = {
  trades: Trade[];
};

const chartConfig = {
  netPL: {
    label: 'Net P/L',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const dateLocaleMap = {
  en: enUS,
  es: es,
  fr: fr,
  de: de,
};

export default function WeekdayPLChart({ trades }: WeekdayPLChartProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const dateLocale = dateLocaleMap[language] || enUS;

  const chartData = useMemo(() => {
    const weekdayData: { [key: number]: { netPL: number, trades: number } } = {
        0: { netPL: 0, trades: 0 }, // Sun
        1: { netPL: 0, trades: 0 }, // Mon
        2: { netPL: 0, trades: 0 }, // Tue
        3: { netPL: 0, trades: 0 }, // Wed
        4: { netPL: 0, trades: 0 }, // Thu
        5: { netPL: 0, trades: 0 }, // Fri
        6: { netPL: 0, trades: 0 }, // Sat
    };
    
    const closedTrades = trades.filter(trade => trade.exitDate && trade.exitPrice);

    closedTrades.forEach(trade => {
      const dayIndex = getDay(new Date(trade.exitDate!));
      let pl = ((trade.exitPrice ?? 0) - trade.entryPrice) * trade.quantity;
      if (trade.tradeStyle === 'Option') {
        pl *= 100;
      }
      pl = pl - (trade.commissions || 0) - (trade.fees || 0);

      weekdayData[dayIndex].netPL += pl;
      weekdayData[dayIndex].trades += 1;
    });

    return Object.entries(weekdayData).map(([dayIndex, data]) => ({
      day: format(new Date(2024, 0, parseInt(dayIndex) + 1), 'EEE', { locale: dateLocale }), // Use a static date to get day name
      netPL: data.netPL,
      trades: data.trades,
    }));

  }, [trades, dateLocale]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('performanceByDay')}</CardTitle>
        <CardDescription>{t('performanceByDayDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.some(d => d.trades > 0) ? (
          <ChartContainer config={{...chartConfig, netPL: {...chartConfig.netPL, label: t('netPL')}}} className="h-[250px] w-full">
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent 
                    formatter={(value, name, props) => [`$${(value as number).toFixed(2)} (${props.payload.trades} ${t('trades')})`, t('netPL')]}
                    labelFormatter={(label) => label}
                />}
              />
               <Bar dataKey="netPL" radius={4}>
                {chartData.map((entry) => (
                  <Cell key={`cell-${entry.day}`} fill={entry.netPL >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground text-center">
            {t('weekdayPLPlaceholder')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
