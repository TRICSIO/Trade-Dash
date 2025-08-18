'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Save, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Trade } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { useLanguage } from '@/context/language-context';
import { enUS, es, fr, de } from 'date-fns/locale';
import { Badge } from './ui/badge';

const tradeStyles = ["Day Trade", "Swing Trade", "Position Trade", "Scalp", "Option"];

const useFormSchema = () => {
  const { t } = useTranslation();
  return z.object({
    instrument: z.string().min(1, t('instrumentRequired')),
    account: z.string().min(1, t('accountRequired')),
    entryDate: z.date({ required_error: t('entryDateRequired') }),
    exitDate: z.date().optional(),
    entryPrice: z.coerce.number().positive(t('entryPricePositive')),
    exitPrice: z.coerce.number().positive(t('exitPricePositive')).optional(),
    quantity: z.coerce.number().positive(t('quantityPositive')),
    tradeStyle: z.string().min(1, t('tradeStyleRequired')),
    notes: z.string().optional(),
    commissions: z.coerce.number().optional(),
    fees: z.coerce.number().optional(),
    tags: z.array(z.string()).optional(),
  }).refine(data => {
      if (data.exitDate && data.entryDate) {
          return data.exitDate >= data.entryDate;
      }
      return true;
  }, {
      message: t('exitDateError'),
      path: ["exitDate"],
  });
};

type AddTradeDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSaveTrade: (trade: Omit<Trade, 'id'>, id?: string) => void;
  trade?: Trade;
};

const dateLocaleMap = {
  en: enUS,
  es: es,
  fr: fr,
  de: de,
};

export default function AddTradeDialog({ isOpen, onOpenChange, onSaveTrade, trade }: AddTradeDialogProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const formSchema = useFormSchema();
  const isEditing = !!trade;

  const dateLocale = dateLocaleMap[language] || enUS;
  
  const [tagInput, setTagInput] = useState('');
    
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditing ? {
        ...trade,
        entryDate: new Date(trade.entryDate),
        exitDate: trade.exitDate ? new Date(trade.exitDate) : undefined,
        tags: trade.tags || [],
    } : {
      instrument: '',
      account: 'Primary',
      notes: '',
      tags: [],
    },
  });

  const tags = form.watch('tags') || [];

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
        form.setValue('tags', [...tags, tagInput]);
        setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    form.setValue('tags', tags.filter(tag => tag !== tagToRemove));
  };


  useEffect(() => {
    if(isOpen) {
        form.reset(isEditing ? {
            ...trade,
            entryDate: new Date(trade.entryDate),
            exitDate: trade.exitDate ? new Date(trade.exitDate) : undefined,
            tags: trade.tags || [],
        } : {
          instrument: '',
          account: 'Primary',
          entryPrice: undefined,
          exitPrice: undefined,
          quantity: undefined,
          tradeStyle: undefined,
          entryDate: undefined,
          exitDate: undefined,
          notes: '',
          commissions: undefined,
          fees: undefined,
          tags: [],
        });
    }
  }, [isOpen, isEditing, trade, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const tradeToSave = {
        ...values,
        exitPrice: values.exitPrice || undefined,
        exitDate: values.exitDate || undefined,
        commissions: values.commissions || undefined,
        fees: values.fees || undefined,
        tags: values.tags || [],
    };
    onSaveTrade(tradeToSave, trade?.id);
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('editTrade') : t('logNewTrade')}</DialogTitle>
          <DialogDescription>
            {isEditing ? t('updateTradeDetails') : t('enterTradeDetails')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="instrument"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('instrument')}</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., AAPL, BTC/USD" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="account"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('account')}</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Fidelity, IBKR" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('entryDate')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? format(field.value, 'PPP', { locale: dateLocale }) : <span>{t('pickADate')}</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar locale={dateLocale} mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="exitDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('exitDate')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? format(field.value, 'PPP', { locale: dateLocale }) : <span>{t('pickADate')}</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar locale={dateLocale} mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entryPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('entryPrice')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="exitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('exitPrice')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('quantity')}</FormLabel>
                    <FormControl>
                        <Input type="number" step="any" placeholder="e.g., 100" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                    control={form.control}
                    name="commissions"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('commissions')}</FormLabel>
                        <FormControl>
                            <Input type="number" step="any" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="fees"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('fees')}</FormLabel>
                        <FormControl>
                            <Input type="number" step="any" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <FormField
                control={form.control}
                name="tradeStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tradeStyle')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectTradeStyle')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tradeStyles.map(style => (
                          <SelectItem key={style} value={style}>{t(style.toLowerCase().replace(' ', '') as any)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Textarea placeholder={t('whyTrade')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
                <FormLabel>{t('tags')}</FormLabel>
                <div className="flex gap-2">
                    <Input
                        placeholder={t('addTagPlaceholder')}
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag();
                            }
                        }}
                    />
                    <Button type="button" onClick={handleAddTag}>{t('addTag')}</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map(tag => (
                        <Badge key={tag} variant="secondary">
                            {tag}
                            <button type="button" className="ml-2" onClick={() => handleRemoveTag(tag)}>
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            </FormItem>
            <DialogFooter>
              <Button type="submit">
                {isEditing ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {isEditing ? t('saveChanges') : t('saveTrade')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
