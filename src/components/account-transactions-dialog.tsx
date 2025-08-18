
'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/use-translation';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Save, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AccountTransaction } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Textarea } from './ui/textarea';

interface AccountTransactionsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  accountName: string;
  transactions: AccountTransaction[];
  onSaveTransactions: (transactions: AccountTransaction[]) => void;
}

const useFormSchema = () => {
    const { t } = useTranslation();
    return z.object({
        date: z.date({ required_error: t('dateRequired') }),
        type: z.enum(['deposit', 'withdrawal'], { required_error: t('transactionTypeRequired') }),
        amount: z.coerce.number().positive(t('amountRequired')),
        notes: z.string().optional(),
    });
};

export default function AccountTransactionsDialog({
  isOpen,
  onOpenChange,
  accountName,
  transactions,
  onSaveTransactions,
}: AccountTransactionsDialogProps) {
  const { t } = useTranslation();
  const formSchema = useFormSchema();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      type: 'deposit',
      amount: undefined,
      notes: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const newTransaction: AccountTransaction = {
      ...values,
      id: crypto.randomUUID(),
    };
    const updatedTransactions = [...transactions, newTransaction].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    onSaveTransactions(updatedTransactions);
    form.reset({ date: new Date(), type: 'deposit', amount: undefined, notes: '' });
  };
  
  const handleDeleteTransaction = (id: string) => {
      const updatedTransactions = transactions.filter(t => t.id !== id);
      onSaveTransactions(updatedTransactions);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('accountTransactions')} - {accountName}</DialogTitle>
          <DialogDescription>{t('accountTransactionsDescription')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 border p-4 rounded-md">
                <h3 className="font-semibold">{t('addTransaction')}</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>{t('date')}</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={'outline'}
                                    className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                                >
                                    {field.value ? format(field.value, 'PPP') : <span>{t('pickADate')}</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('type')}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="deposit">{t('deposit')}</SelectItem>
                                    <SelectItem value="withdrawal">{t('withdrawal')}</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('amount')}</FormLabel>
                            <FormControl>
                                <Input type="number" step="any" placeholder="0.00" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('notes')}</FormLabel>
                            <FormControl>
                                <Textarea placeholder={t('transactionNotesPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button type="submit"><Plus className="mr-2 h-4 w-4"/> {t('saveTransaction')}</Button>
                </DialogFooter>
            </form>
        </Form>
        
        <div className="space-y-4 max-h-64 overflow-y-auto">
            {transactions.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('date')}</TableHead>
                            <TableHead>{t('type')}</TableHead>
                            <TableHead>{t('amount')}</TableHead>
                            <TableHead>{t('notes')}</TableHead>
                            <TableHead className="text-right">{t('actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map(tx => (
                            <TableRow key={tx.id}>
                                <TableCell>{format(new Date(tx.date), 'PP')}</TableCell>
                                <TableCell>
                                    <span className={cn('font-semibold', tx.type === 'deposit' ? 'text-green-500' : 'text-red-500')}>
                                        {t(tx.type)}
                                    </span>
                                </TableCell>
                                <TableCell>${tx.amount.toFixed(2)}</TableCell>
                                <TableCell>{tx.notes}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteTransaction(tx.id)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <p className="text-center text-muted-foreground py-4">{t('noTransactions')}</p>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
