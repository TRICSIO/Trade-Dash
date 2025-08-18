
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import type { Trade } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';

type InstrumentPLChartProps = {
  trades: Trade[];
};

const chartConfig = {
  netPL: {
    label: 'Net P/L',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;


export default function InstrumentPLChart({ trades }: InstrumentPLChartProps) {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    const instrumentData: { [key: string]: { netPL: number, trades: number } } = {};
    
    const closedTrades = trades.filter(trade => trade.exitDate && trade.exitPrice);

    closedTrades.forEach(trade => {
      let pl = ((trade.exitPrice ?? 0) - trade.entryPrice) * trade.quantity;
      if (trade.tradeStyle === 'Option') {
        pl *= 100;
      }
      pl = pl - (trade.commissions || 0) - (trade.fees || 0);

      if (instrumentData[trade.instrument]) {
        instrumentData[trade.instrument].netPL += pl;
        instrumentData[trade.instrument].trades += 1;
      } else {
        instrumentData[trade.instrument] = { netPL: pl, trades: 1 };
      }
    });

    return Object.entries(instrumentData)
        .map(([instrument, data]) => ({
            instrument,
            netPL: data.netPL,
            trades: data.trades,
        }))
        .sort((a, b) => b.netPL - a.netPL) // Sort by most profitable
        .slice(0, 10); // Take top 10

  }, [trades]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('performanceByInstrument')}</CardTitle>
        <CardDescription>{t('performanceByInstrumentDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={{...chartConfig, netPL: {...chartConfig.netPL, label: t('netPL')}}} className="h-[250px] w-full">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="instrument"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={80}
              />
              <XAxis type="number" tickFormatter={(value) => `$${value}`} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent 
                    formatter={(value, name, props) => [`$${(value as number).toFixed(2)} (${props.payload.trades} ${t('trades')})`, t('netPL')]}
                    labelFormatter={(label) => label}
                />}
              />
               <Bar dataKey="netPL" radius={4}>
                {chartData.map((entry) => (
                  <Cell key={`cell-${entry.instrument}`} fill={entry.netPL >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground text-center">
            {t('instrumentPLPlaceholder')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
