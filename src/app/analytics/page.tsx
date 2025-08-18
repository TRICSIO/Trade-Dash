
'use client';

import { useMemo, useState } from 'react';
import ProtectedRoute from "@/components/protected-route";
import AppHeader from "@/components/header";
import AddTradeDialog from "@/components/add-trade-dialog";
import ImportTradesDialog from "@/components/import-trades-dialog";
import { useToast } from "@/hooks/use-toast";
import useFirestoreTrades from "@/hooks/use-firestore-trades";
import { useAuth } from "@/hooks/use-auth";
import type { Trade } from "@/lib/types";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { parse } from 'papaparse';
import { processCsvData } from '@/ai/flows/process-csv-data';
import WeekdayPLChart from '@/components/weekday-pl-chart';
import InstrumentPLChart from '@/components/instrument-pl-chart';

function AnalyticsPage() {
    const [isAddTradeOpen, setAddTradeOpen] = useState(false);
    const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);
    const [isImportTradeOpen, setImportTradeOpen] = useState(false);
    const { user } = useAuth();
    const { trades, startingBalances, accountSettings, setTrades, setStartingBalances, setAccountSettings } = useFirestoreTrades(user?.uid);
    const { toast } = useToast();
    const { t } = useTranslation();
    const [selectedAccount, setSelectedAccount] = useState('all');

    const accounts = useMemo(() => {
        const allAccounts = Array.from(new Set([...trades.map(t => t.account), ...Object.keys(startingBalances)]));
        return ['all', ...allAccounts];
    }, [trades, startingBalances]);

     const filteredTrades = useMemo(() => {
        if (selectedAccount === 'all') {
            return trades;
        }
        return trades.filter(t => t.account === selectedAccount);
    }, [trades, selectedAccount]);

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

        if (!(tradeData.account in startingBalances)) {
            setStartingBalances(prev => ({...prev, [tradeData.account]: 0}));
        }
        if (!(tradeData.account in accountSettings)) {
            setAccountSettings(prev => ({...prev, [tradeData.account]: { color: '#000000' }}));
        }
    };
    
    const handleImportTrades = (file: File, account: string) => {
        setImportTradeOpen(false);
        toast({
            title: t('importStarted'),
            description: t('importProcessing'),
        });

        parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const csvString = parse(results.data, { header: false }).toString();
                    const processedData = await processCsvData({ csvData: csvString });

                    if (processedData.trades.length === 0) {
                        toast({
                            title: t('importFailed'),
                            description: t('importNoTrades'),
                            variant: 'destructive'
                        });
                        return;
                    }

                    const newTrades: Omit<Trade, 'id'>[] = processedData.trades.map(t => ({
                        ...t,
                        account,
                        entryDate: new Date(t.entryDate),
                        exitDate: t.exitDate ? new Date(t.exitDate) : undefined,
                        tags: t.tags || [],
                    }));

                    const updatedTrades = [...newTrades.map(t => ({...t, id: crypto.randomUUID()})), ...trades];

                    setTrades(updatedTrades.map(trade => ({
                        ...trade,
                        entryDate: new Date(trade.entryDate),
                        exitDate: trade.exitDate ? new Date(trade.exitDate) : undefined,
                    })));

                    toast({
                        title: t('importSuccessful'),
                        description: t('importSuccessMessage', {count: newTrades.length}),
                    });

                } catch (error) {
                    console.error("CSV processing error:", error);
                    toast({
                        title: t('importFailed'),
                        description: t('importError'),
                        variant: 'destructive'
                    });
                }
            },
            error: (error) => {
                toast({
                    title: t('importFailed'),
                    description: error.message,
                    variant: 'destructive'
                });
            }
        });
    };

    const handleDialogClose = (isOpen: boolean) => {
        if (!isOpen) {
            setEditingTrade(undefined);
        }
        setAddTradeOpen(isOpen);
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader onAddTradeClick={() => setAddTradeOpen(true)} onImportClick={() => setImportTradeOpen(true)} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
                 <Card>
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1">
                            <CardTitle>{t('advancedAnalytics')}</CardTitle>
                            <CardDescription>{t('advancedAnalyticsDescription')}</CardDescription>
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
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid gap-8 lg:grid-cols-2">
                    <WeekdayPLChart trades={filteredTrades} />
                    <InstrumentPLChart trades={filteredTrades} />
                </div>

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

export default function Analytics() {
    return (
        <ProtectedRoute>
            <AnalyticsPage />
        </ProtectedRoute>
    );
}
