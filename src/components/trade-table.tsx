'use client';

import { useMemo, useState } from 'react';
import type { Trade, AccountSettings } from '@/lib/types';
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
import { useTranslation } from '@/hooks/use-translation';
import { useLanguage } from '@/context/language-context';
import { enUS, es } from 'date-fns/locale';

type TradeTableProps = {
  trades: Trade[];
  accountSettings: AccountSettings;
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (tradeId: string) => void;
};

export default function TradeTable({ trades, accountSettings, onEditTrade, onDeleteTrade }: TradeTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState<Trade | null>(null);
  const { t } = useTranslation();
  const { language } = useLanguage();
  const dateLocale = language === 'es' ? es : enUS;

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
                <CardTitle>{t('tradeHistory')}</CardTitle>
                <CardDescription>{t('tradeHistoryDescription')}</CardDescription>
            </div>
            <Input
                placeholder={t('filterByInstrument')}
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
                <TableHead>{t('instrument')}</TableHead>
                <TableHead>{t('account')}</TableHead>
                <TableHead>{t('style')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('cost')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('proceeds')}</TableHead>
                <TableHead>{t('pl')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('plPercent')}</TableHead>
                <TableHead>{t('entryDate')}</TableHead>
                <TableHead>{t('exitDate')}</TableHead>
                <TableHead>{t('qty')}</TableHead>
                <TableHead className="hidden lg:table-cell max-w-[250px]">{t('notes')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
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
                    const accountColor = accountSettings[trade.account]?.color;
                    
                    return (
                    <TableRow key={trade.id}>
                        <TableCell className="font-medium">{trade.instrument}</TableCell>
                        <TableCell>
                             <Badge
                                variant="outline"
                                style={accountColor ? { borderColor: accountColor, color: accountColor } : {}}
                            >
                                {trade.account}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant="secondary">{t(trade.tradeStyle.toLowerCase().replace(' ',''))}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">${cost.toFixed(2)}</TableCell>
                        <TableCell className="hidden md:table-cell">{proceeds !== null ? `$${proceeds.toFixed(2)}` : '-'}</TableCell>
                        <TableCell className={pl === null ? 'text-muted-foreground' : isProfit ? 'text-green-400' : 'text-red-400'}>
                            <div className="flex items-center gap-1">
                                {pl === null ? <Clock className="h-4 w-4" /> : isProfit ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                                {pl !== null ? `$${pl.toFixed(2)}` : t('open')}
                            </div>
                        </TableCell>
                        <TableCell className={`hidden md:table-cell ${plPercent === null ? 'text-muted-foreground' : isProfit ? 'text-green-400' : 'text-red-400'}`}>
                            <div className="flex items-center gap-1">
                                {plPercent === null ? <Clock className="h-3 w-3" /> : <Percent className="h-3 w-3" />}
                                {plPercent !== null ? `${plPercent.toFixed(2)}%` : t('open')}
                            </div>
                        </TableCell>
                        <TableCell>{format(new Date(trade.entryDate), 'PP', { locale: dateLocale })}</TableCell>
                        <TableCell>{trade.exitDate ? format(new Date(trade.exitDate), 'PP', { locale: dateLocale }) : '-'}</TableCell>
                        <TableCell>{trade.quantity}</TableCell>
                        <TableCell className="hidden lg:table-cell max-w-[250px] truncate">{trade.notes || '-'}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => onEditTrade(trade)}>
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">{t('edit')}</span>
                                </Button>

                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteCandidate(trade)}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">{t('delete')}</span>
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                    );
                })
                ) : (
                <TableRow>
                    <TableCell colSpan={12} className="h-24 text-center">
                    {t('noTradesFound')}
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
            <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteTradeWarning', { instrument: deleteCandidate?.instrument, account: deleteCandidate?.account })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
