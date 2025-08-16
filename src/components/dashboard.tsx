'use client';

import { useState, useMemo, ChangeEvent, useEffect } from 'react';
import type { Trade } from '@/lib/types';
import useFirestoreTrades from '@/hooks/use-firestore-trades';
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
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from '@/hooks/use-translation';
import StyleDistributionChart from './style-distribution-chart';


export default function Dashboard() {
  const { user } = useAuth();
  const { trades, startingBalances, setTrades, setStartingBalances, loading } = useFirestoreTrades(user?.uid);
  
  const [isAddTradeOpen, setAddTradeOpen] = useState(false);
  const [isImportTradeOpen, setImportTradeOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);
  const [selectedAccount, setSelectedAccount] = useState('all');
  const { toast } = useToast();
  const { t } = useTranslation();

  const accounts = useMemo(() => {
    const allAccounts = trades.map(t => t.account);
    return ['all', ...Array.from(new Set(allAccounts))];
  }, [trades]);

  useEffect(() => {
    if (!accounts.includes(selectedAccount)) {
      setSelectedAccount('all');
    }
  }, [accounts, selectedAccount]);

  const filteredTrades = useMemo(() => {
    if (selectedAccount === 'all') {
      return trades;
    }
    return trades.filter(t => t.account === selectedAccount);
  }, [trades, selectedAccount]);

  const currentStartingBalance = useMemo(() => {
    if (selectedAccount === 'all') {
      return Object.values(startingBalances).reduce((acc, balance) => acc + balance, 0);
    }
    return startingBalances[selectedAccount] || 0;
  }, [selectedAccount, startingBalances]);


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
        updatedTrades = trades.map(t => t.id === id ? { ...t, ...tradeData, id } : t);
    } else {
        const tradeWithId = { ...tradeData, id: crypto.randomUUID() };
        updatedTrades = [tradeWithId, ...trades];
    }
    setTrades(updatedTrades.map(trade => ({
        ...trade,
        entryDate: new Date(trade.entryDate),
        exitDate: trade.exitDate ? new Date(trade.exitDate) : undefined,
    })));

    if (!accounts.includes(tradeData.account)) {
      setStartingBalances(prev => ({...prev, [tradeData.account]: 0}));
    }
  };

  const handleDeleteTrade = (tradeId: string) => {
    const updatedTrades = trades.filter(t => t.id !== tradeId);
    setTrades(updatedTrades);
  }

  const handleBalanceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (selectedAccount !== 'all') {
        setStartingBalances(prev => ({
            ...prev,
            [selectedAccount]: Number(value)
        }));
    }
  }

  const handleImportTrades = (broker: string, file: File, account: string) => {
    console.log(`Importing from ${broker} into ${account}`, file);
    toast({
        title: t('importStarted'),
        description: `Parsing for ${broker} into ${account} is not yet implemented.`,
    });
    setImportTradeOpen(false);
  };
  
  const handleBackup = () => {
    try {
        const backupData = {
            trades,
            startingBalances,
        };
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const date = new Date().toISOString().slice(0, 10);
        link.download = `trade-insights-backup-${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({
            title: t('backupSuccessful'),
            description: t('yourDataHasBeenDownloaded'),
        });
    } catch (error) {
        toast({
            title: t('backupFailed'),
            description: t('couldNotCreateBackup'),
            variant: "destructive",
        });
    }
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
    
    const accountBalance = currentStartingBalance + totalNetPL - openTradesCost;

    return { totalTrades, winningTradesCount, losingTradesCount, winRate, totalGain, totalLoss, totalNetPL, totalInvested, totalReturn, avgGain, avgLoss, profitFactor, accountBalance };
  }, [filteredTrades, currentStartingBalance]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader 
        onAddTradeClick={handleOpenAddDialog} 
        onImportClick={() => setImportTradeOpen(true)}
        onBackupClick={handleBackup} 
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle>{t('performanceOverview')}</CardTitle>
              <CardDescription>{t('kpiDescription')}</CardDescription>
            </div>
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="w-full sm:max-w-xs space-y-2">
                  <Label htmlFor="account-select">{t('account')}</Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger id="account-select">
                      <SelectValue placeholder={t('selectAccount')} />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(acc => (
                        <SelectItem key={acc} value={acc}>{acc === 'all' ? t('allAccounts') : acc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
              {selectedAccount !== 'all' && (
                <div className="w-full sm:max-w-xs space-y-2">
                  <Label htmlFor="starting-balance">{t('startingBalance')}</Label>
                  <Input
                    id="starting-balance"
                    type="number"
                    value={currentStartingBalance}
                    onChange={handleBalanceChange}
                    className="mt-1"
                    placeholder="e.g., 10000"
                  />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
              <div className="mb-6">
                <Card className="bg-primary/10 border-primary/40 inline-block">
                    <CardHeader className="pb-2">
                        <CardDescription>{t('currentAccountBalance')} ({selectedAccount === 'all' ? t('all') : selectedAccount})</CardDescription>
                        <CardTitle className="text-3xl">${accountBalance.toFixed(2)}</CardTitle>
                    </CardHeader>
                </Card>
              </div>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                <KpiCard title={t('totalTrades')} value={totalTrades.toString()} />
                <KpiCard title={t('winningTrades')} value={winningTradesCount.toString()} />
                <KpiCard title={t('losingTrades')} value={losingTradesCount.toString()} />
                <KpiCard title={t('winRate')} value={`${winRate.toFixed(1)}%`} />
                <KpiCard title={t('totalGain')} value={totalGain.toFixed(2)} isCurrency />
                <KpiCard title={t('totalLoss')} value={totalLoss.toFixed(2)} isCurrency />
                <KpiCard title={t('totalNetPL')} value={totalNetPL.toFixed(2)} isCurrency />
                <KpiCard title={t('totalInvestedCapital')} value={totalInvested.toFixed(2)} isCurrency />
                <KpiCard title={t('totalReturn')} value={`${totalReturn.toFixed(1)}%`} />
                <KpiCard title={t('averageGain')} value={avgGain.toFixed(2)} isCurrency />
                <KpiCard title={t('averageLoss')} value={avgLoss.toFixed(2)} isCurrency />
                <KpiCard title={t('profitFactor')} value={isFinite(profitFactor) ? profitFactor.toFixed(2) : '∞'} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-6">
            <div className="lg:col-span-4">
                <PerformanceChart trades={filteredTrades.filter(t => t.exitDate && t.exitPrice)} startingBalance={currentStartingBalance} />
            </div>
            <div className="lg:col-span-2">
                <AiSuggestions trades={filteredTrades} />
            </div>
             <div className="lg:col-span-2">
                <StyleDistributionChart trades={filteredTrades} />
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
        accounts={accounts.filter(acc => acc !== 'all')}
      />
    </div>
  );
}
