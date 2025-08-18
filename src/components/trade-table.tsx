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
import { ArrowUpRight, ArrowDownLeft, Pencil, Trash2, Clock, Percent, X } from 'lucide-react';
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
import { enUS, es, fr, de } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type TradeTableProps = {
  trades: Trade[];
  accountSettings: AccountSettings;
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (tradeId: string) => void;
};

const dateLocaleMap = {
    en: enUS,
    es: es,
    fr: fr,
    de: de,
};

type TradeStatus = 'all' | 'profit' | 'loss' | 'open';
const tradeStyles = ["All", "Day Trade", "Swing Trade", "Position Trade", "Scalp", "Option"];

export default function TradeTable({ trades, accountSettings, onEditTrade, onDeleteTrade }: TradeTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState<Trade | null>(null);
  const [statusFilter, setStatusFilter] = useState<TradeStatus>('all');
  const [styleFilter, setStyleFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState<string | 'all'>('all');
  const { t } = useTranslation();
  const { language } = useLanguage();
  const dateLocale = dateLocaleMap[language] || enUS;
  
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    trades.forEach(trade => {
        trade.tags?.forEach(tag => tags.add(tag));
    });
    return ['all', ...Array.from(tags)];
  }, [trades]);

  const filteredTrades = useMemo(() => {
    return trades
        .filter(trade => {
            // Search term filter
            const instrumentMatch = trade.instrument.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Status filter
            const isClosed = trade.exitDate && trade.exitPrice;
            const multiplier = trade.tradeStyle === 'Option' ? 100 : 1;
            const cost = trade.entryPrice * trade.quantity * multiplier;
            const proceeds = isClosed ? (trade.exitPrice ?? 0) * trade.quantity * multiplier : null;
            const pl = isClosed && proceeds ? proceeds - cost - (trade.commissions || 0) - (trade.fees || 0) : null;
            
            let statusMatch = true;
            if (statusFilter === 'profit') {
                statusMatch = pl !== null && pl > 0;
            } else if (statusFilter === 'loss') {
                statusMatch = pl !== null && pl < 0;
            } else if (statusFilter === 'open') {
                statusMatch = pl === null;
            }

            // Style filter
            const styleMatch = styleFilter === 'All' || trade.tradeStyle === styleFilter;

            // Tag filter
            const tagMatch = tagFilter === 'all' || (trade.tags && trade.tags.includes(tagFilter));

            return instrumentMatch && statusMatch && styleMatch && tagMatch;
        });
  }, [trades, searchTerm, statusFilter, styleFilter, tagFilter]);
  
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
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Input
                    placeholder={t('filterByInstrument')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:max-w-xs"
                />
                 <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TradeStatus)}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                        <SelectValue placeholder={t('filterByStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('allTrades')}</SelectItem>
                        <SelectItem value="profit">{t('winningTrades')}</SelectItem>
                        <SelectItem value="loss">{t('losingTrades')}</SelectItem>
                        <SelectItem value="open">{t('openTrades')}</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={styleFilter} onValueChange={setStyleFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder={t('filterByStyle')} />
                    </SelectTrigger>
                    <SelectContent>
                        {tradeStyles.map(style => (
                            <SelectItem key={style} value={style}>{style === 'All' ? t('allStyles') : t(style.toLowerCase().replace(' ', '') as any)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={tagFilter} onValueChange={(v) => setTagFilter(v)}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder={t('filterByTag')} />
                    </SelectTrigger>
                    <SelectContent>
                        {allTags.map(tag => (
                            <SelectItem key={tag} value={tag}>{tag === 'all' ? t('allTags') : tag}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
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
                <TableHead className="hidden lg:table-cell">{t('tags')}</TableHead>
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
                    const pl = isClosed && proceeds ? proceeds - cost - (trade.commissions || 0) - (trade.fees || 0) : null;
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
                            <Badge variant="secondary">{t(trade.tradeStyle.toLowerCase().replace(' ','') as any)}</Badge>
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
                         <TableCell className="hidden lg:table-cell">
                            <div className="flex flex-wrap gap-1">
                                {trade.tags?.map(tag => (
                                    <Badge key={tag} variant="outline">{tag}</Badge>
                                ))}
                            </div>
                        </TableCell>
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
