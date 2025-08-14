'use client';

import { useMemo, useState } from 'react';
import type { Trade } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format } from 'date-fns';

type TradeTableProps = {
  trades: Trade[];
};

export default function TradeTable({ trades }: TradeTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTrades = useMemo(() => {
    return trades
        .map(trade => ({
            ...trade,
            entryDate: new Date(trade.entryDate),
            exitDate: new Date(trade.exitDate),
        }))
        .filter(trade =>
            trade.instrument.toLowerCase().includes(searchTerm.toLowerCase())
        );
  }, [trades, searchTerm]);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <CardTitle>Trade History</CardTitle>
                <CardDescription>A log of all your past trades.</CardDescription>
            </div>
            <Input
                placeholder="Filter by instrument..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
            />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Instrument</TableHead>
                <TableHead>P/L</TableHead>
                <TableHead>Style</TableHead>
                <TableHead>Entry Date</TableHead>
                <TableHead>Exit Date</TableHead>
                <TableHead>Notes</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredTrades.length > 0 ? (
                filteredTrades.map(trade => {
                    const pl = trade.exitPrice - trade.entryPrice;
                    const isProfit = pl >= 0;
                    return (
                    <TableRow key={trade.id}>
                        <TableCell className="font-medium">{trade.instrument}</TableCell>
                        <TableCell className={isProfit ? 'text-green-400' : 'text-red-400'}>
                            <div className="flex items-center gap-2">
                                {isProfit ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                                {pl.toFixed(2)}
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="secondary">{trade.tradeStyle}</Badge>
                        </TableCell>
                        <TableCell>{format(trade.entryDate, 'PP')}</TableCell>
                        <TableCell>{format(trade.exitDate, 'PP')}</TableCell>
                        <TableCell className="max-w-[250px] truncate">{trade.notes || '-'}</TableCell>
                    </TableRow>
                    );
                })
                ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                    No trades found.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
