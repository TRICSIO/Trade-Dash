'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

function useFirestoreTrades(userId?: string) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [startingBalances, setStartingBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const saveDataToFirestore = useCallback(
    async (newTrades: Trade[], newBalances: Record<string, number>) => {
      if (!userId) return;
      try {
        const userDocRef = doc(db, 'users', userId);
        // Firestore doesn't store `Date` objects directly, so we convert them to ISO strings
        const tradesToStore = newTrades.map(t => ({
          ...t,
          entryDate: t.entryDate.toISOString(),
          exitDate: t.exitDate?.toISOString(),
        }));
        await setDoc(userDocRef, { trades: tradesToStore, startingBalances: newBalances }, { merge: true });
      } catch (error) {
        console.error("Error saving data to Firestore:", error);
        toast({ title: "Error", description: "Could not save changes to the cloud.", variant: 'destructive'});
      }
    },
    [userId, toast]
  );
  
  const debouncedSave = useCallback(debounce(saveDataToFirestore, 1500), [saveDataToFirestore]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const userDocRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const tradesFromDb = (data.trades || []).map((t: any) => ({
            ...t,
            entryDate: new Date(t.entryDate),
            exitDate: t.exitDate ? new Date(t.exitDate) : undefined,
          }));
          setTrades(tradesFromDb);
          setStartingBalances(data.startingBalances || {});
        } else {
          // If no doc, it means it's a new user, register page will create it.
          // Or the user has no data yet.
          setTrades([]);
          setStartingBalances({});
        }
      } catch (error) {
        console.error("Error fetching data from Firestore:", error);
        toast({ title: "Error", description: "Could not load data from the cloud.", variant: 'destructive'});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, toast]);

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
