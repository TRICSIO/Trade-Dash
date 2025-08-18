
'use client';

import ProtectedRoute from "@/components/protected-route";
import AppHeader from "@/components/header";
import { useState } from "react";
import AddTradeDialog from "@/components/add-trade-dialog";
import ImportTradesDialog from "@/components/import-trades-dialog";
import { useToast } from "@/hooks/use-toast";
import useFirestoreTrades from "@/hooks/use-firestore-trades";
import { useAuth } from "@/hooks/use-auth";
import type { Trade } from "@/lib/types";
import { useTranslation } from "@/hooks/use-translation";

function StockNewsPage() {
    const [isAddTradeOpen, setAddTradeOpen] = useState(false);
    const [isImportTradeOpen, setImportTradeOpen] = useState(false);
    const { user } = useAuth();
    const { trades, startingBalances, accountSettings, setTrades, setStartingBalances, setAccountSettings } = useFirestoreTrades(user?.uid);
    const { toast } = useToast();
    const { t } = useTranslation();

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
    
    const handleImportTrades = (broker: string, file: File, account: string) => {
        console.log(`Importing from ${broker} into ${account}`, file);
        toast({
            title: t('importStarted'),
            description: `Parsing for ${broker} into ${account} is not yet implemented.`,
        });
        setImportTradeOpen(false);
    };
    
    const accounts = Array.from(new Set([...trades.map(t => t.account), ...Object.keys(startingBalances)]));

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader onAddTradeClick={() => setAddTradeOpen(true)} onImportClick={() => setImportTradeOpen(true)} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                   <h1 className="text-2xl font-semibold">This page has been removed.</h1>
                </div>
            </main>
             <AddTradeDialog
                isOpen={isAddTradeOpen}
                onOpenChange={setAddTradeOpen}
                onSaveTrade={handleAddOrUpdateTrade}
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


export default function StockNews() {
    return (
        <ProtectedRoute>
            <StockNewsPage />
        </ProtectedRoute>
    );
}
