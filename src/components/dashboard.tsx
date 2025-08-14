'use client';

import { useState, useMemo, ChangeEvent } from 'react';
import type { Trade } from '@/lib/types';
import useLocalStorage from '@/hooks/use-local-storage';
import AppHeader from '@/components/header';
import AddTradeDialog from '@/components/add-trade-dialog';
import KpiCard from '@/components/kpi-card';
import PerformanceChart from '@/components/performance-chart';
import AiSuggestions from '@/components/ai-suggestions';
import TradeTable from '@/components/trade-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [startingBalance, setStartingBalance] = useLocalStorage<number>('startingBalance', 10000);
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
        exitDate: trade.exitDate ? new Date(trade.exitDate) : undefined,
    })));
  };

  const handleDeleteTrade = (tradeId: string) => {
    const updatedTrades = trades.filter(t => t.id !== tradeId);
    setTrades(updatedTrades);
  }

  const handleBalanceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setStartingBalance(Number(value));
  }

  const {
    totalTrades,
    winningTradesCount,
    losingTradesCount,
    winRate,
    totalGain,
    totalLoss,
    totalNetPL,
    totalInvested,
    totalReturn,
    avgGain,
    avgLoss,
    profitFactor,
    accountBalance,
  } = useMemo(() => {
    let totalInvested = 0;
    
    const closedTrades = trades.filter(t => t.exitDate && t.exitPrice);
    
    const tradeResults = closedTrades.map(t => {
        const multiplier = t.tradeStyle === 'Option' ? 100 : 1;
        const cost = t.entryPrice * t.quantity * multiplier;
        totalInvested += cost;
        const proceeds = (t.exitPrice ?? 0) * t.quantity * multiplier;
        return {pl: proceeds - cost, exitDate: t.exitDate!};
    });
    
    const totalNetPL = tradeResults.reduce((acc, result) => acc + result.pl, 0);

    const winningTrades = tradeResults.filter(result => result.pl > 0);
    const losingTrades = tradeResults.filter(result => result.pl < 0);
    
    const winningTradesCount = winningTrades.length;
    const losingTradesCount = losingTrades.length;
    
    const totalTrades = trades.length;

    const winRate = closedTrades.length > 0 ? (winningTradesCount / closedTrades.length) * 100 : 0;
    
    const totalGain = winningTrades.reduce((acc, trade) => acc + trade.pl, 0);
    const totalLoss = losingTrades.reduce((acc, trade) => acc + trade.pl, 0);
    
    const avgGain = winningTradesCount > 0 ? totalGain / winningTradesCount : 0;
    const avgLoss = losingTradesCount > 0 ? totalLoss / losingTradesCount : 0;

    const profitFactor = totalLoss !== 0 ? Math.abs(totalGain / totalLoss) : Infinity;

    const totalReturn = totalInvested > 0 ? (totalNetPL / totalInvested) * 100 : 0;

    const openTradesCost = trades.filter(t => !t.exitDate || !t.exitPrice).reduce((acc, t) => {
        const multiplier = t.tradeStyle === 'Option' ? 100 : 1;
        return acc + (t.entryPrice * t.quantity * multiplier);
    }, 0);
    
    const accountBalance = startingBalance + totalNetPL - openTradesCost;

    return { totalTrades, winningTradesCount, losingTradesCount, winRate, totalGain, totalLoss, totalNetPL, totalInvested, totalReturn, avgGain, avgLoss, profitFactor, accountBalance };
  }, [trades, startingBalance]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader onAddTradeClick={handleOpenAddDialog} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Your key trading metrics at a glance (based on closed trades).</CardDescription>
            </div>
            <div className="w-full max-w-xs space-y-2">
              <div>
                <Label htmlFor="starting-balance">Starting Balance</Label>
                <Input
                  id="starting-balance"
                  type="number"
                  value={startingBalance}
                  onChange={handleBalanceChange}
                  className="mt-1"
                  placeholder="e.g., 10000"
                />
              </div>
              <Card className="bg-primary/10 border-primary/40">
                <CardContent className="p-3">
                    <p className="text-sm text-muted-foreground">Account Balance</p>
                    <p className="text-2xl font-bold">${accountBalance.toFixed(2)}</p>
                </CardContent>
              </Card>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            <KpiCard title="Total Trades" value={totalTrades.toString()} />
            <KpiCard title="Winning Trades" value={winningTradesCount.toString()} />
            <KpiCard title="Losing Trades" value={losingTradesCount.toString()} />
            <KpiCard title="Win Rate" value={`${winRate.toFixed(1)}%`} />
            <KpiCard title="Total Gain" value={totalGain.toFixed(2)} isCurrency />
            <KpiCard title="Total Loss" value={totalLoss.toFixed(2)} isCurrency />
            <KpiCard title="Total Net P/L" value={totalNetPL.toFixed(2)} isCurrency />
            <KpiCard title="Total Invested Capital" value={totalInvested.toFixed(2)} isCurrency />
            <KpiCard title="Total Return" value={`${totalReturn.toFixed(1)}%`} />
            <KpiCard title="Average Gain" value={avgGain.toFixed(2)} isCurrency />
            <KpiCard title="Average Loss" value={avgLoss.toFixed(2)} isCurrency />
            <KpiCard title="Profit Factor" value={isFinite(profitFactor) ? profitFactor.toFixed(2) : '∞'} />
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
                <PerformanceChart trades={trades.filter(t => t.exitDate && t.exitPrice)} startingBalance={startingBalance} />
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

    