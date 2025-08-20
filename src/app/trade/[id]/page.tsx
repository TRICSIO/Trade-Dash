
'use client';

import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import useFirestoreTrades from '@/hooks/use-firestore-trades';
import { useAuth } from '@/hooks/use-auth';
import ProtectedRoute from '@/components/protected-route';
import AppHeader from '@/components/header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDownLeft, ArrowUpRight, Clock, Percent } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';
import { useLanguage } from '@/context/language-context';
import { enUS, es, fr, de } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import AddTradeDialog from '@/components/add-trade-dialog';
import ImportTradesDialog from '@/components/import-trades-dialog';
import { Trade } from '@/lib/types';
import { useRouter } from 'next/navigation';

const dateLocaleMap = {
    en: enUS,
    es: es,
    fr: fr,
    de: de,
};

function TradeDetailPageContent() {
    const params = useParams();
    const { id } = params;
    const { user } = useAuth();
    const { trades, loading, accountSettings, setTrades, allAccounts, addAccount } = useFirestoreTrades(user?.uid);
    const { t } = useTranslation();
    const { language } = useLanguage();
    const dateLocale = dateLocaleMap[language] || enUS;
    const router = useRouter();
    
    const [isAddTradeOpen, setAddTradeOpen] = useState(false);
    const [isImportTradeOpen, setImportTradeOpen] = useState(false);
    
    const trade = useMemo(() => trades.find(t => t.id === id), [trades, id]);

    const handleAddOrUpdateTrade = (tradeData: Omit<Trade, 'id'>, tradeId?: string) => {
        if (!allAccounts.includes(tradeData.account)) {
            addAccount(tradeData.account, 0);
        }

        let updatedTrades;
        if (tradeId) {
            updatedTrades = trades.map(t => t.id === tradeId ? { ...t, ...tradeData, id: tradeId } : t);
        } else {
            const tradeWithId = { ...tradeData, id: crypto.randomUUID() };
            updatedTrades = [tradeWithId, ...trades];
        }
        setTrades(updatedTrades.map(t => ({
            ...t,
            entryDate: new Date(t.entryDate),
            exitDate: t.exitDate ? new Date(t.exitDate) : undefined,
        })));
    };

    if (loading) {
        return (
             <div className="flex flex-col min-h-screen bg-background">
                <AppHeader onAddTradeClick={() => {}} onImportClick={() => {}}/>
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <Skeleton className="h-10 w-36" />
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <Skeleton className="h-8 w-48" />
                                        <Skeleton className="h-4 w-64" />
                                    </div>
                                    <Skeleton className="h-6 w-24 rounded-full" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                                </div>
                                <Skeleton className="h-24 w-full" />
                            </CardContent>
                             <CardFooter>
                                <Skeleton className="h-10 w-28" />
                            </CardFooter>
                        </Card>
                    </div>
                </main>
            </div>
        );
    }
    
    if (!trade) {
        return (
             <div className="flex flex-col min-h-screen bg-background">
                <AppHeader onAddTradeClick={() => setAddTradeOpen(true)} onImportClick={() => setImportTradeOpen(true)}/>
                <main className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <h1 className="text-2xl font-bold">{t('tradeNotFound')}</h1>
                        <p className="text-muted-foreground">{t('tradeNotFoundDescription')}</p>
                        <Button asChild className="mt-4">
                            <Link href="/">{t('backToDashboard')}</Link>
                        </Button>
                    </div>
                </main>
             </div>
        );
    }

    const isClosed = trade.exitDate && trade.exitPrice;
    const multiplier = trade.tradeStyle === 'Option' ? 100 : 1;
    const cost = trade.entryPrice * trade.quantity * multiplier;
    const proceeds = isClosed ? (trade.exitPrice ?? 0) * trade.quantity * multiplier : null;
    const pl = isClosed && proceeds ? proceeds - cost - (trade.commissions || 0) - (trade.fees || 0) : null;
    const plPercent = pl !== null && cost !== 0 ? (pl / cost) * 100 : null;
    const isProfit = pl !== null && pl >= 0;
    const accountColor = accountSettings[trade.account]?.color;

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader onAddTradeClick={() => setAddTradeOpen(true)} onImportClick={() => setImportTradeOpen(true)}/>
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div>
                        <Button variant="outline" onClick={() => router.back()}>
                            {t('backToDashboard')}
                        </Button>
                    </div>
                    <Card>
                        <CardHeader>
                             <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-3xl">{trade.instrument}</CardTitle>
                                    <CardDescription>
                                        {t(trade.tradeStyle.toLowerCase().replace(' ','') as any)} {t('tradeOn')} {trade.account}
                                    </CardDescription>
                                </div>
                                <Badge
                                    variant="outline"
                                    style={accountColor ? { borderColor: accountColor, color: accountColor } : {}}
                                >
                                    {accountSettings[trade.account]?.accountNickname || trade.account}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                                <div className="p-4 bg-secondary rounded-lg">
                                    <p className="text-sm text-muted-foreground">{t('entryDate')}</p>
                                    <p className="font-semibold">{format(new Date(trade.entryDate), 'PP', { locale: dateLocale })}</p>
                                </div>
                                <div className="p-4 bg-secondary rounded-lg">
                                    <p className="text-sm text-muted-foreground">{t('exitDate')}</p>
                                    <p className="font-semibold">{trade.exitDate ? format(new Date(trade.exitDate), 'PP', { locale: dateLocale }) : t('open')}</p>
                                </div>
                                 <div className="p-4 bg-secondary rounded-lg">
                                    <p className="text-sm text-muted-foreground">{t('quantity')}</p>
                                    <p className="font-semibold">{trade.quantity}</p>
                                </div>
                                <div className="p-4 bg-secondary rounded-lg">
                                    <p className="text-sm text-muted-foreground">{t('entryPrice')}</p>
                                    <p className="font-semibold">${trade.entryPrice.toFixed(2)}</p>
                                </div>
                                <div className="p-4 bg-secondary rounded-lg">
                                    <p className="text-sm text-muted-foreground">{t('exitPrice')}</p>
                                    <p className="font-semibold">{trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : '-'}</p>
                                </div>
                            </div>

                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">{t('cost')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-2xl font-bold">${cost.toFixed(2)}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">{t('proceeds')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-2xl font-bold">{proceeds !== null ? `$${proceeds.toFixed(2)}` : '-'}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">{t('pl')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className={pl === null ? '' : isProfit ? 'text-green-400' : 'text-red-400'}>
                                         <p className="text-2xl font-bold flex items-center gap-2">
                                            {pl === null ? <Clock className="h-6 w-6 text-muted-foreground" /> : isProfit ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownLeft className="h-6 w-6" />}
                                            {pl !== null ? `$${pl.toFixed(2)}` : t('open')}
                                         </p>
                                    </CardContent>
                                </Card>
                                 <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">{t('plPercent')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className={plPercent === null ? '' : isProfit ? 'text-green-400' : 'text-red-400'}>
                                        <p className="text-2xl font-bold flex items-center gap-2">
                                            {plPercent === null ? <Clock className="h-5 w-5 text-muted-foreground" /> : <Percent className="h-5 w-5" />}
                                            {plPercent !== null ? `${plPercent.toFixed(2)}%` : t('open')}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                             {(trade.commissions || trade.fees) && (
                                <div className="grid grid-cols-2 gap-4">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">{t('commissions')}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-lg font-semibold">${(trade.commissions || 0).toFixed(2)}</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">{t('fees')}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-lg font-semibold">${(trade.fees || 0).toFixed(2)}</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {trade.notes && (
                                <div>
                                    <h3 className="font-semibold mb-2">{t('notes')}</h3>
                                    <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-secondary rounded-lg">
                                        <p>{trade.notes}</p>
                                    </div>
                                </div>
                            )}

                            {trade.tags && trade.tags.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-2">{t('tags')}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {trade.tags.map(tag => (
                                            <Badge key={tag} variant="secondary">{tag}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => setAddTradeOpen(true)}>{t('editTrade')}</Button>
                        </CardFooter>
                    </Card>
                </div>
            </main>
            <AddTradeDialog
                isOpen={isAddTradeOpen}
                onOpenChange={setAddTradeOpen}
                onSaveTrade={handleAddOrUpdateTrade}
                trade={trade}
                accounts={allAccounts}
            />
             <ImportTradesDialog
                isOpen={isImportTradeOpen}
                onOpenChange={setImportTradeOpen}
                onImport={() => {}}
                accounts={[]}
            />
        </div>
    );
}


export default function TradeDetailPage() {
    return (
        <ProtectedRoute>
            <TradeDetailPageContent />
        </ProtectedRoute>
    )
}
