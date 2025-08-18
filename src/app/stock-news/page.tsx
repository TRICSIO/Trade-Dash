
'use client';

import { useState } from "react";
import AppHeader from "@/components/header";
import ProtectedRoute from "@/components/protected-route";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getStockNews, type NewsArticle } from "@/ai/flows/get-stock-news";
import { Newspaper } from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import AddTradeDialog from "@/components/add-trade-dialog";
import ImportTradesDialog from "@/components/import-trades-dialog";
import { useToast } from "@/hooks/use-toast";
import useFirestoreTrades from "@/hooks/use-firestore-trades";
import { useAuth } from "@/hooks/use-auth";
import type { Trade } from "@/lib/types";
import { useTranslation } from "@/hooks/use-translation";

// --- Server Component for Data Fetching ---

async function StockNewsList() {
    const news = await getStockNews();

    return (
        <div className="grid gap-6">
            {news.articles.map((article, index) => (
                <NewsCard key={index} article={article} />
            ))}
        </div>
    )
}

function NewsCard({ article }: { article: NewsArticle }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{article.title}</CardTitle>
                <CardDescription>{article.summary}</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-between">
                <Badge variant="outline">{article.source}</Badge>
                <span className="text-sm text-muted-foreground">{article.publishedDate}</span>
            </CardFooter>
        </Card>
    )
}

function LoadingSkeleton() {
    return (
        <div className="grid gap-6">
            {[...Array(5)].map((_, i) => (
                 <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-5/6" />
                    </CardHeader>
                    <CardFooter className="flex justify-between">
                       <Skeleton className="h-6 w-24" />
                       <Skeleton className="h-6 w-32" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

// --- Client Component for Page Shell and Interactivity ---

function StockNewsPageClient({ children }: { children: React.ReactNode }) {
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
                    <div className="flex items-center gap-2">
                         <Newspaper className="h-8 w-8" />
                         <div>
                            <h1 className="text-3xl font-bold">Market News & Announcements</h1>
                            <p className="text-muted-foreground">The latest news moving the stock market.</p>
                         </div>
                    </div>
                    {children}
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


// --- Main Page Export ---

export default function StockNews() {
    return (
        <ProtectedRoute>
            <StockNewsPageClient>
                <Suspense fallback={<LoadingSkeleton />}>
                    <StockNewsList />
                </Suspense>
            </StockNewsPageClient>
        </ProtectedRoute>
    );
}