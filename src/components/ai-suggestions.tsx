'use client';

import { useState } from 'react';
import type { Trade } from '@/lib/types';
import { generateTradeSuggestions } from '@/ai/flows/generate-trade-suggestions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { format } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';

type AiSuggestionsProps = {
  trades: Trade[];
};

export default function AiSuggestions({ trades }: AiSuggestionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState('');
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleGenerate = async () => {
    if (trades.length === 0) {
        toast({
            title: t('notEnoughData'),
            description: t('logTradesForSuggestions'),
            variant: 'destructive',
        });
        return;
    }

    setIsLoading(true);
    setIsOpen(true);

    try {
      const tradeHistory = trades
        .map(
          (t, i) => {
            const isClosed = t.exitDate && t.exitPrice;
            let plString = "N/A (Open)";
            if (isClosed) {
                let pl = (t.exitPrice! - t.entryPrice) * t.quantity;
                if (t.tradeStyle === 'Option') {
                  pl *= 100;
                }
                plString = `$${pl.toFixed(2)}`;
            }
            
            return `Trade ${i + 1}: Instrument: ${t.instrument}, Style: ${t.tradeStyle}, Qty: ${t.quantity}, Entry: ${format(new Date(t.entryDate), 'yyyy-MM-dd')} at $${t.entryPrice.toFixed(2)}, Exit: ${isClosed ? format(new Date(t.exitDate!), 'yyyy-MM-dd') : 'Open'} at ${isClosed ? `$${t.exitPrice!.toFixed(2)}` : 'N/A'}, P/L: ${plString}, Notes: ${t.notes || 'N/A'}`
          }
        )
        .join('\n');

      const result = await generateTradeSuggestions({ tradeHistory });
      setSuggestions(result.suggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      toast({
        title: t('error'),
        description: t('failedToGenerateSuggestions'),
        variant: 'destructive',
      });
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <CardTitle>{t('aiPoweredInsights')}</CardTitle>
          </div>
          <CardDescription>{t('getPersonalizedSuggestions')}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
            <div className="text-sm text-muted-foreground bg-accent/20 p-4 rounded-lg border border-dashed">
                {t('aiAnalysisDescription')}
            </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
            <Wand2 className="mr-2 h-4 w-4" />
            {t('generateSuggestions')}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('yourPersonalizedTradeSuggestions')}</DialogTitle>
            <DialogDescription>
              {t('aiSuggestionsBasedOnHistory')}
            </DialogDescription>
          </DialogHeader>
          {isLoading ? (
            <div className="space-y-4 py-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-h-[60vh] overflow-y-auto p-1">
              {suggestions.split('\n').map((line, index) => {
                if(line.trim() === '') return <br key={index}/>
                if (line.startsWith('*') && line.endsWith('*')) {
                    return <p key={index} className="font-bold my-2">{line.slice(1, -1)}</p>
                }
                return <p key={index}>{line}</p>
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
