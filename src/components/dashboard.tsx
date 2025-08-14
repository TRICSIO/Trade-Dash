'use client';

import { useState, useMemo, ChangeEvent } from 'react';
import type { Trade } from '@/lib/types';
import useLocalStorage from '@/hooks/use-local-storage';
import AppHeader from '@/components/header';
import AddTradeDialog from '@/components/add-trade-dialog';
import ImportTradesDialog from '@/components/import-trades-dialog';
import KpiCard from '@/components/kpi-card';
import PerformanceChart from '@/components/performance-chart';
import AiSuggestions from '@/components/ai-suggestions';
import TradeTable from '@/components/trade-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';


const initialTrades: Trade[] = [
    {
        id: '1',
        instrument: 'AAPL',
        account: 'Fidelity',
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
        account: 'Fidelity',
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
        account: 'IBKR',
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
  const [isImportTradeOpen, setImportTradeOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);
  const [selectedAccount, setSelectedAccount] = useState('all');
  const { toast } = useToast();

  const accounts = useMemo(() => {
    const allAccounts = trades.map(t => t.account);
    return ['all', ...Array.from(new Set(allAccounts))];
  }, [trades]);

  const filteredTrades = useMemo(() => {
    if (selectedAccount === 'all') {
      return trades;
    }
    return trades.filter(t => t.account === selectedAccount);
  }, [trades, selectedAccount]);


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

  const handleImportTrades = (broker: string, file: File) => {
    console.log(`Importing from ${broker}`, file);
    // As discussed, the parsing logic is complex and broker-specific.
    // This is a placeholder to show the UI is connected.
    toast({
        title: "Import Started",
        description: `Parsing for ${broker} is not yet implemented.`,
    });
    setImportTradeOpen(false);
  };

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
    
    const closedTrades = filteredTrades.filter(t => t.exitDate && t.exitPrice);
    
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
    
    const totalTrades = filteredTrades.length;

    const winRate = closedTrades.length > 0 ? (winningTradesCount / closedTrades.length) * 100 : 0;
    
    const totalGain = winningTrades.reduce((acc, trade) => acc + trade.pl, 0);
    const totalLoss = losingTrades.reduce((acc, trade) => acc + trade.pl, 0);
    
    const avgGain = winningTradesCount > 0 ? totalGain / winningTradesCount : 0;
    const avgLoss = losingTradesCount > 0 ? totalLoss / losingTradesCount : 0;

    const profitFactor = totalLoss !== 0 ? Math.abs(totalGain / totalLoss) : Infinity;

    const totalReturn = totalInvested > 0 ? (totalNetPL / totalInvested) * 100 : 0;

    const openTradesCost = filteredTrades.filter(t => !t.exitDate || !t.exitPrice).reduce((acc, t) => {
        const multiplier = t.tradeStyle === 'Option' ? 100 : 1;
        return acc + (t.entryPrice * t.quantity * multiplier);
    }, 0);
    
    // Account balance should only be calculated when looking at all accounts, otherwise it's misleading
    const accountBalance = selectedAccount === 'all' ? startingBalance + totalNetPL - openTradesCost : 0;

    return { totalTrades, winningTradesCount, losingTradesCount, winRate, totalGain, totalLoss, totalNetPL, totalInvested, totalReturn, avgGain, avgLoss, profitFactor, accountBalance };
  }, [filteredTrades, startingBalance, selectedAccount]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader onAddTradeClick={handleOpenAddDialog} onImportClick={() => setImportTradeOpen(true)} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Your key trading metrics. Use the dropdown to filter by account.</CardDescription>
            </div>
            <div className="w-full sm:w-auto flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="w-full sm:max-w-xs space-y-2">
                  <Label htmlFor="account-select">Account</Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger id="account-select">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(acc => (
                        <SelectItem key={acc} value={acc}>{acc === 'all' ? 'All Accounts' : acc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
              {selectedAccount === 'all' && (
                <div className="w-full sm:max-w-xs space-y-2">
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
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedAccount === 'all' && (
              <div className="mb-6">
                <Card className="bg-primary/10 border-primary/40 inline-block">
                    <CardHeader className="pb-2">
                        <CardDescription>Current Account Balance</CardDescription>
                        <CardTitle className="text-3xl">${accountBalance.toFixed(2)}</CardTitle>
                    </CardHeader>
                </Card>
              </div>
            )}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
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
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
                <PerformanceChart trades={filteredTrades.filter(t => t.exitDate && t.exitPrice)} startingBalance={startingBalance} />
            </div>
            <div className="lg:col-span-2">
                <AiSuggestions trades={filteredTrades} />
            </div>
        </div>
        
        <TradeTable trades={filteredTrades} onEditTrade={handleOpenEditDialog} onDeleteTrade={handleDeleteTrade} />

      </main>
      <AddTradeDialog
        isOpen={isAddTradeOpen}
        onOpenChange={handleDialogClose}
        onSaveTrade={handleAddOrUpdateTrade}
        trade={editingTrade}
      />
      <ImportTradesDialog
        isOpen={isImportTradeOpen}
        onOpenChange={setImportTradeOpen}
        onImport={handleImportTrades}
      />
    </div>
  );
}
