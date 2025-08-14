'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle, BarChartBig } from 'lucide-react';

type AppHeaderProps = {
  onAddTradeClick: () => void;
};

export default function AppHeader({ onAddTradeClick }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center space-x-4 px-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-2 items-center">
            <BarChartBig className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Trade Insights</h1>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
            <Button onClick={onAddTradeClick}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Trade
            </Button>
        </div>
      </div>
    </header>
  );
}
