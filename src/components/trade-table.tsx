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
import { ArrowUpRight, ArrowDownLeft, Pencil, Trash2, Clock, Percent } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type TradeTableProps = {
  trades: Trade[];
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (tradeId: string) => void;
};

export default function TradeTable({ trades, onEditTrade, onDeleteTrade }: TradeTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState<Trade | null>(null);

  const filteredTrades = useMemo(() => {
    return trades
        .filter(trade =>
            trade.instrument.toLowerCase().includes(searchTerm.toLowerCase())
        );
  }, [trades, searchTerm]);
  
  const handleDeleteConfirm = () => {
    if(deleteCandidate) {
        onDeleteTrade(deleteCandidate.id);
        setDeleteCandidate(null);
    }
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <CardTitle>Trade History</CardTitle>
                <CardDescription>A log of all your past and open trades.</CardDescription>
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
                <TableHead>Account</TableHead>
                <TableHead>Style</TableHead>
                <TableHead className="hidden md:table-cell">Cost</TableHead>
                <TableHead className="hidden md:table-cell">Proceeds</TableHead>
                <TableHead>P/L ($)</TableHead>
                <TableHead className="hidden md:table-cell">P/L (%)</TableHead>
                <TableHead>Entry Date</TableHead>
                <TableHead>Exit Date</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead className="hidden lg:table-cell max-w-[250px]">Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredTrades.length > 0 ? (
                filteredTrades.map(trade => {
                    const isClosed = trade.exitDate && trade.exitPrice;
                    const multiplier = trade.tradeStyle === 'Option' ? 100 : 1;
                    const cost = trade.entryPrice * trade.quantity * multiplier;
                    const proceeds = isClosed ? (trade.exitPrice ?? 0) * trade.quantity * multiplier : null;
                    const pl = isClosed && proceeds ? proceeds - cost : null;
                    const plPercent = pl !== null && cost !== 0 ? (pl / cost) * 100 : null;
                    const isProfit = pl !== null && pl >= 0;
                    
                    return (
                    <TableRow key={trade.id}>
                        <TableCell className="font-medium">{trade.instrument}</TableCell>
                        <TableCell>
                            <Badge variant="outline">{trade.account}</Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant="secondary">{trade.tradeStyle}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">${cost.toFixed(2)}</TableCell>
                        <TableCell className="hidden md:table-cell">{proceeds !== null ? `$${proceeds.toFixed(2)}` : '-'}</TableCell>
                        <TableCell className={pl === null ? 'text-muted-foreground' : isProfit ? 'text-green-400' : 'text-red-400'}>
                            <div className="flex items-center gap-1">
                                {pl === null ? <Clock className="h-4 w-4" /> : isProfit ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                                {pl !== null ? `$${pl.toFixed(2)}` : 'Open'}
                            </div>
                        </TableCell>
                        <TableCell className={`hidden md:table-cell ${plPercent === null ? 'text-muted-foreground' : isProfit ? 'text-green-400' : 'text-red-400'}`}>
                            <div className="flex items-center gap-1">
                                {plPercent === null ? <Clock className="h-4 w-4" /> : <Percent className="h-3 w-3" />}
                                {plPercent !== null ? `${plPercent.toFixed(2)}%` : 'Open'}
                            </div>
                        </TableCell>
                        <TableCell>{format(new Date(trade.entryDate), 'PP')}</TableCell>
                        <TableCell>{trade.exitDate ? format(new Date(trade.exitDate), 'PP') : '-'}</TableCell>
                        <TableCell>{trade.quantity}</TableCell>
                        <TableCell className="hidden lg:table-cell max-w-[250px] truncate">{trade.notes || '-'}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => onEditTrade(trade)}>
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                </Button>

                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteCandidate(trade)}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                    );
                })
                ) : (
                <TableRow>
                    <TableCell colSpan={12} className="h-24 text-center">
                    No trades found.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
     <AlertDialog open={!!deleteCandidate} onOpenChange={(isOpen) => !isOpen && setDeleteCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the trade for{' '}
              <span className="font-semibold">{deleteCandidate?.instrument}</span> from the <span className="font-semibold">{deleteCandidate?.account}</span> account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
