
'use client';

import AppHeader from "@/components/header";
import ProtectedRoute from "@/components/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTopMovers, type TopMoversOutput } from "@/ai/flows/get-top-movers";
import type { StockMover } from "@/lib/types";
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";


function MoverTable({ title, data, isGainers }: { title: string, data: StockMover[], isGainers: boolean }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {isGainers ? <ArrowUpRight className="h-6 w-6 text-green-500" /> : <ArrowDownLeft className="h-6 w-6 text-red-500" />}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ticker</TableHead>
                            <TableHead className="hidden sm:table-cell">Name</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Change</TableHead>
                            <TableHead className="text-right">% Change</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((stock) => (
                            <TableRow key={stock.ticker}>
                                <TableCell className="font-medium">{stock.ticker}</TableCell>
                                <TableCell className="hidden sm:table-cell">{stock.name}</TableCell>
                                <TableCell className="text-right">{stock.price}</TableCell>
                                <TableCell className={`text-right ${isGainers ? 'text-green-500' : 'text-red-500'}`}>
                                    {stock.change}
                                </TableCell>
                                <TableCell className={`text-right ${isGainers ? 'text-green-500' : 'text-red-500'}`}>
                                    {stock.changePercent}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function TopMoversClientPage({ initialData }: { initialData?: TopMoversOutput }) {
    const [movers, setMovers] = useState<TopMoversOutput | undefined>(initialData);
    const [loading, setLoading] = useState(!initialData);

    useEffect(() => {
        if (!initialData) {
            getTopMovers().then(data => {
                setMovers(data);
                setLoading(false);
            });
        }
    }, [initialData]);

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader onAddTradeClick={() => {}} onImportClick={() => {}} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="flex items-center gap-2">
                         <TrendingUp className="h-8 w-8" />
                         <div>
                            <h1 className="text-3xl font-bold">Top Movers</h1>
                            <p className="text-muted-foreground">Today's biggest market gainers and losers.</p>
                         </div>
                    </div>

                    {loading || !movers ? (
                         <div className="grid gap-8 md:grid-cols-2">
                            <Skeleton className="h-96 w-full" />
                            <Skeleton className="h-96 w-full" />
                         </div>
                    ) : (
                        <div className="grid gap-8 md:grid-cols-2">
                            <MoverTable title="Top Gainers" data={movers.gainers} isGainers={true} />
                            <MoverTable title="Top Losers" data={movers.losers} isGainers={false} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

// This is the Server Component that fetches the data
async function TopMoversPage() {
    const data = await getTopMovers();
    return <TopMoversClientPage initialData={data} />;
}

// This remains the default export for the route
export default function TopMovers() {
    return (
        <ProtectedRoute>
            <Suspense fallback={<TopMoversClientPage />}>
              <TopMoversPage />
            </Suspense>
        </ProtectedRoute>
    );
}
