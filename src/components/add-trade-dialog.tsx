'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, PlusCircle, Save } from 'lucide-react';

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
import { useEffect } from 'react';

const formSchema = z.object({
  instrument: z.string().min(1, 'Instrument is required.'),
  entryDate: z.date({ required_error: 'Entry date is required.' }),
  exitDate: z.date().optional(),
  entryPrice: z.coerce.number().positive('Entry price must be positive.'),
  exitPrice: z.coerce.number().positive('Exit price must be positive.').optional(),
  quantity: z.coerce.number().positive('Quantity must be a positive number.'),
  tradeStyle: z.string().min(1, 'Trade style is required.'),
  notes: z.string().optional(),
}).refine(data => {
    if (data.exitDate && data.entryDate) {
        return data.exitDate >= data.entryDate;
    }
    return true;
}, {
    message: "Exit date cannot be before entry date.",
    path: ["exitDate"],
}).refine(data => {
    if (data.exitDate && !data.exitPrice) {
        return false;
    }
    return true;
}, {
    message: "Exit price is required if exit date is set.",
    path: ["exitPrice"],
}).refine(data => {
    if (data.exitPrice && !data.exitDate) {
        return false;
    }
    return true;
}, {
    message: "Exit date is required if exit price is set.",
    path: ["exitDate"],
});


type AddTradeDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSaveTrade: (trade: Omit<Trade, 'id'>, id?: string) => void;
  trade?: Trade;
};

const tradeStyles = ["Day Trade", "Swing Trade", "Position Trade", "Scalp", "Option"];

export default function AddTradeDialog({ isOpen, onOpenChange, onSaveTrade, trade }: AddTradeDialogProps) {
  const isEditing = !!trade;
    
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditing ? {
        ...trade,
        entryDate: new Date(trade.entryDate),
        exitDate: trade.exitDate ? new Date(trade.exitDate) : undefined,
    } : {
      instrument: '',
      notes: '',
    },
  });

  useEffect(() => {
    if(isOpen) {
        form.reset(isEditing ? {
            ...trade,
            entryDate: new Date(trade.entryDate),
            exitDate: trade.exitDate ? new Date(trade.exitDate) : undefined,
        } : {
          instrument: '',
          entryPrice: undefined,
          exitPrice: undefined,
          quantity: undefined,
          tradeStyle: undefined,
          entryDate: undefined,
          exitDate: undefined,
          notes: '',
        });
    }
  }, [isOpen, isEditing, trade, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const tradeToSave = {
        ...values,
        exitPrice: values.exitPrice || undefined,
        exitDate: values.exitDate || undefined,
    };
    onSaveTrade(tradeToSave, trade?.id);
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Trade' : 'Log a New Trade'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details of your trade.' : 'Enter the details of your trade. Click save when you\'re done.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="instrument"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instrument</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., AAPL, BTC/USD" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Entry Date</FormLabel>
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
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
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
                name="exitDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Exit Date</FormLabel>
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
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
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
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entryPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Price</FormLabel>
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
                    <FormLabel>Exit Price</FormLabel>
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
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" placeholder="e.g., 100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="tradeStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trade Style</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a trade style" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tradeStyles.map(style => (
                          <SelectItem key={style} value={style}>{style}</SelectItem>
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
                  <FormLabel>Notes / Commentary</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Why did you take this trade?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">
                {isEditing ? <Save className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                {isEditing ? 'Save Changes' : 'Save Trade'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
