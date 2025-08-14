'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type KpiCardProps = {
  title: string;
  value: string;
  isCurrency?: boolean;
};

export default function KpiCard({ title, value, isCurrency = false }: KpiCardProps) {
    const isPercentage = value.includes('%');
    const numericValue = parseFloat(value.replace(/[^0-9.-]+/g,""));
    const isPositive = numericValue >= 0;
    
    let valueColor = 'text-foreground';
    if (isCurrency || isPercentage) {
        valueColor = isPositive ? 'text-green-400' : 'text-red-400';
    }

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueColor}`}>
          {(isCurrency || (isPercentage && isPositive)) && isPositive && '+'}{value}
        </div>
      </CardContent>
    </Card>
  );
}
