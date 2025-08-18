'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import type { Trade } from '@/lib/types';
import { format } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';
import { useLanguage } from '@/context/language-context';
import { enUS, es, fr, de } from 'date-fns/locale';

type MonthlyPLChartProps = {
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

export default function MonthlyPLChart({ trades }: MonthlyPLChartProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const dateLocale = dateLocaleMap[language] || enUS;

  const chartData = useMemo(() => {
    const monthlyData: { [key: string]: number } = {};
    
    const closedTrades = trades.filter(trade => trade.exitDate && trade.exitPrice);

    closedTrades.forEach(trade => {
      const month = format(new Date(trade.exitDate!), 'MMM yyyy', { locale: dateLocale });
      let pl = ((trade.exitPrice ?? 0) - trade.entryPrice) * trade.quantity;
      if (trade.tradeStyle === 'Option') {
        pl *= 100;
      }
      pl = pl - (trade.commissions || 0) - (trade.fees || 0);

      if (monthlyData[month]) {
        monthlyData[month] += pl;
      } else {
        monthlyData[month] = pl;
      }
    });

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
        return new Date(a).getTime() - new Date(b).getTime();
    });

    return sortedMonths.map(month => ({
      month,
      netPL: monthlyData[month],
    }));

  }, [trades, dateLocale]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('monthlyPL')}</CardTitle>
        <CardDescription>{t('monthlyPLDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={{...chartConfig, netPL: {...chartConfig.netPL, label: t('netPL')}}} className="h-[250px] w-full">
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent 
                    formatter={(value, name) => [`$${(value as number).toFixed(2)}`, t('netPL')]} 
                    labelFormatter={(label) => label}
                />}
              />
               <Bar dataKey="netPL" radius={4}>
                {chartData.map((entry) => (
                  <Cell key={`cell-${entry.month}`} fill={entry.netPL >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground text-center">
            {t('monthlyPLPlaceholder')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Recharts doesn't export Cell component from the main entry point
// This is a workaround to make it available
const Cell = (props: any) => {
  return <div {...props} />;
};
