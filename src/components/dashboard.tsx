'use client';

import { useState, useMemo } from 'react';
import type { Trade } from '@/lib/types';
import useLocalStorage from '@/hooks/use-local-storage';
import AppHeader from '@/components/header';
import AddTradeDialog from '@/components/add-trade-dialog';
import KpiCard from '@/components/kpi-card';
import PerformanceChart from '@/components/performance-chart';
import AiSuggestions from '@/components/ai-suggestions';
import TradeTable from '@/components/trade-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const initialTrades: Trade[] = [
    {
        id: '1',
        instrument: 'AAPL',
        entryDate: new Date('2023-10-01'),
        exitDate: new Date('2023-10-15'),
        entryPrice: 150.00,
        exitPrice: 165.50,
        quantity: 10,
        tradeStyle: 'Swing Trade',
        notes: 'Caught a good run-up before earnings.'
    },
    {
        id: '2',
        instrument: 'GOOGL',
        entryDate: new Date('2023-11-05'),
        exitDate: new Date('2023-11-06'),
        entryPrice: 135.20,
        exitPrice: 132.80,
        quantity: 50,
        tradeStyle: 'Day Trade',
        notes: 'News catalyst didn\'t play out as expected.'
    },
    {
        id: '3',
        instrument: 'TSLA',
        entryDate: new Date('2023-11-10'),
        exitDate: new Date('2023-12-20'),
        entryPrice: 220.50,
        exitPrice: 255.00,
        quantity: 5,
        tradeStyle: 'Position Trade',
        notes: 'Long term hold based on delivery numbers.'
    }
];

export default function Dashboard() {
  const [trades, setTrades] = useLocalStorage<Trade[]>('trades', initialTrades);
  const [isAddTradeOpen, setAddTradeOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);

  const handleOpenAddDialog = () => {
    setEditingTrade(undefined);
    setAddTradeOpen(true);
  }

  const handleOpenEditDialog = (trade: Trade) => {
    setEditingTrade(trade);
    setAddTradeOpen(true);
  }

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
        setEditingTrade(undefined);
    }
    setAddTradeOpen(isOpen);
  }

  const handleAddOrUpdateTrade = (tradeData: Omit<Trade, 'id'>, id?: string) => {
    let updatedTrades;
    if (id) {
        // Editing existing trade
        updatedTrades = trades.map(t => t.id === id ? { ...t, ...tradeData } : t);
    } else {
        // Adding new trade
        const tradeWithId = { ...tradeData, id: crypto.randomUUID() };
        updatedTrades = [tradeWithId, ...trades];
    }
    setTrades(updatedTrades.map(trade => ({
        ...trade,
        entryDate: new Date(trade.entryDate),
        exitDate: new Date(trade.exitDate),
    })));
  };

  const handleDeleteTrade = (tradeId: string) => {
    const updatedTrades = trades.filter(t => t.id !== tradeId);
    setTrades(updatedTrades);
  }

  const { totalPL, winRate, riskRewardRatio, winningTradesCount, losingTradesCount } = useMemo(() => {
    if (trades.length === 0) {
      return { totalPL: 0, winRate: 0, riskRewardRatio: 0, winningTradesCount: 0, losingTradesCount: 0 };
    }

    const tradeResults = trades.map(t => {
        const pl = (t.exitPrice - t.entryPrice) * t.quantity;
        return t.tradeStyle === 'Option' ? pl * 100 : pl;
    });
    const totalPL = tradeResults.reduce((acc, pl) => acc + pl, 0);

    const winningTrades = tradeResults.filter(pl => pl > 0);
    const losingTrades = tradeResults.filter(pl => pl < 0);
    
    const winningTradesCount = winningTrades.length;
    const losingTradesCount = losingTrades.length;

    const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;

    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((acc, pl) => acc + pl, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((acc, pl) => acc + pl, 0) / losingTrades.length) : 0;
    
    const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

    return { totalPL, winRate, riskRewardRatio, winningTradesCount, losingTradesCount };
  }, [trades]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader onAddTradeClick={handleOpenAddDialog} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-5">
            <KpiCard title="Total P/L" value={totalPL.toFixed(2)} isCurrency />
            <KpiCard title="Win Rate" value={`${winRate.toFixed(1)}%`} />
            <KpiCard title="Winning Trades" value={winningTradesCount.toString()} />
            <KpiCard title="Losing Trades" value={losingTradesCount.toString()} />
            <KpiCard title="Avg. Risk/Reward" value={riskRewardRatio.toFixed(2)} />
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
                <PerformanceChart trades={trades} />
            </div>
            <div className="lg:col-span-2">
                <AiSuggestions trades={trades} />
            </div>
        </div>
        
        <TradeTable trades={trades} onEditTrade={handleOpenEditDialog} onDeleteTrade={handleDeleteTrade} />

      </main>
      <AddTradeDialog
        isOpen={isAddTradeOpen}
        onOpenChange={handleDialogClose}
        onSaveTrade={handleAddOrUpdateTrade}
        trade={editingTrade}
      />
    </div>
  );
}
