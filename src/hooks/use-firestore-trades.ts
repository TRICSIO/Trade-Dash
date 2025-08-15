'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Trade } from '@/lib/types';
import { useToast } from './use-toast';

// Debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
    let timeout: NodeJS.Timeout | null = null;
  
    return (...args: Parameters<F>): void => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => func(...args), waitFor);
    };
}

const initialTrades: Trade[] = [
    {
        id: '1',
        instrument: 'AAPL',
        account: 'Fidelity',
        entryDate: new Date('2023-10-01T00:00:00'),
        exitDate: new Date('2023-10-15T00:00:00'),
        entryPrice: 150.00,
        exitPrice: 165.50,
        quantity: 10,
        tradeStyle: 'Swing Trade',
        notes: 'Caught a good run-up before earnings.'
    },
    {
        id: '2',
        instrument: 'GOOGL',
        account: 'Fidelity',
        entryDate: new Date('2023-11-05T00:00:00'),
        exitDate: new Date('2023-11-06T00:00:00'),
        entryPrice: 135.20,
        exitPrice: 132.80,
        quantity: 50,
        tradeStyle: 'Day Trade',
        notes: 'News catalyst didn\'t play out as expected.'
    },
    {
        id: '3',
        instrument: 'TSLA',
        account: 'IBKR',
        entryDate: new Date('2023-11-10T00:00:00'),
        exitDate: new Date('2023-12-20T00:00:00'),
        entryPrice: 220.50,
        exitPrice: 255.00,
        quantity: 5,
        tradeStyle: 'Position Trade',
        notes: 'Long term hold based on delivery numbers.'
    }
];

const initialStartingBalances = { 'Fidelity': 10000, 'IBKR': 25000 };

function getLocalStorageKey(userId: string) {
    return `trade-insights-data-${userId}`;
}

function useFirestoreTrades(userId?: string) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [startingBalances, setStartingBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const saveDataToLocalStorage = useCallback(
    (newTrades: Trade[], newBalances: Record<string, number>) => {
      if (!userId) return;
      try {
        const dataToStore = {
          trades: newTrades,
          startingBalances: newBalances
        };
        localStorage.setItem(getLocalStorageKey(userId), JSON.stringify(dataToStore));
      } catch (error) {
        console.error("Error saving data to Local Storage:", error);
        toast({ title: "Error", description: "Could not save changes locally.", variant: 'destructive'});
      }
    },
    [userId, toast]
  );
  
  const debouncedSave = useCallback(debounce(saveDataToLocalStorage, 1500), [saveDataToLocalStorage]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchData = () => {
      setLoading(true);
      try {
        const storedData = localStorage.getItem(getLocalStorageKey(userId));

        if (storedData) {
          const data = JSON.parse(storedData);
          const tradesFromDb = (data.trades || []).map((t: any) => ({
            ...t,
            entryDate: new Date(t.entryDate),
            exitDate: t.exitDate ? new Date(t.exitDate) : undefined,
          }));
          setTrades(tradesFromDb);
          setStartingBalances(data.startingBalances || {});
        } else {
          // If no data in local storage, use initial data
          setTrades(initialTrades);
          setStartingBalances(initialStartingBalances);
          saveDataToLocalStorage(initialTrades, initialStartingBalances);
        }
      } catch (error) {
        console.error("Error fetching data from Local Storage:", error);
        toast({ title: "Error", description: "Could not load data from local storage.", variant: 'destructive'});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, toast, saveDataToLocalStorage]);

  const handleSetTrades = (newTrades: Trade[] | ((val: Trade[]) => Trade[])) => {
    const updatedTrades = newTrades instanceof Function ? newTrades(trades) : newTrades;
    setTrades(updatedTrades);
    debouncedSave(updatedTrades, startingBalances);
  }
  
  const handleSetStartingBalances = (newBalances: Record<string, number> | ((val: Record<string, number>) => Record<string, number>)) => {
    const updatedBalances = newBalances instanceof Function ? newBalances(startingBalances) : newBalances;
    setStartingBalances(updatedBalances);
    debouncedSave(trades, updatedBalances);
  }


  return { trades, startingBalances, setTrades: handleSetTrades, setStartingBalances: handleSetStartingBalances, loading };
}

export default useFirestoreTrades;
