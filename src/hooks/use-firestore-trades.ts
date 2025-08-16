'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Trade, AccountSettings } from '@/lib/types';
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
  const [accountSettings, setAccountSettings] = useState<AccountSettings>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const saveDataToFirestore = useCallback(
    async (newTrades: Trade[], newBalances: Record<string, number>, newSettings: AccountSettings) => {
      if (!userId) return;
      try {
        const userDocRef = doc(db, 'users', userId);
        const tradesToStore = newTrades.map(t => ({
          ...t,
          entryDate: new Date(t.entryDate).toISOString(),
          exitDate: t.exitDate ? new Date(t.exitDate).toISOString() : undefined,
        }));

        await setDoc(userDocRef, { 
            trades: tradesToStore, 
            startingBalances: newBalances, 
            accountSettings: newSettings 
        }, { merge: true });

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

    setLoading(true);
    const userDocRef = doc(db, 'users', userId);
    
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const tradesFromDb = (data.trades || []).map((t: any) => ({
              ...t,
              entryDate: new Date(t.entryDate),
              exitDate: t.exitDate ? new Date(t.exitDate) : undefined,
            }));
            setTrades(tradesFromDb);
            setStartingBalances(data.startingBalances || {});
            setAccountSettings(data.accountSettings || {});
        } else {
            console.log("No such document! A new one will be created on first save.");
            setTrades([]);
            setStartingBalances({});
            setAccountSettings({});
        }
        setLoading(false);
    }, (error) => {
        console.error("Error fetching data from Firestore:", error);
        toast({ title: "Error", description: "Could not load data from the cloud.", variant: 'destructive'});
        setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, toast]);

  const handleSetTrades = (newTrades: Trade[] | ((val: Trade[]) => Trade[])) => {
    const updatedTrades = newTrades instanceof Function ? newTrades(trades) : newTrades;
    setTrades(updatedTrades);
    debouncedSave(updatedTrades, startingBalances, accountSettings);
  }
  
  const handleSetStartingBalances = (newBalances: Record<string, number> | ((val: Record<string, number>) => Record<string, number>)) => {
    const updatedBalances = newBalances instanceof Function ? newBalances(startingBalances) : newBalances;
    setStartingBalances(updatedBalances);
    debouncedSave(trades, updatedBalances, accountSettings);
  }

  const handleSetAccountSettings = (newSettings: AccountSettings | ((val: AccountSettings) => AccountSettings)) => {
    const updatedSettings = newSettings instanceof Function ? newSettings(accountSettings) : newSettings;
    setAccountSettings(updatedSettings);
    debouncedSave(trades, startingBalances, updatedSettings);
  }


  return { trades, startingBalances, accountSettings, setTrades: handleSetTrades, setStartingBalances: handleSetStartingBalances, setAccountSettings: handleSetAccountSettings, loading };
}

export default useFirestoreTrades;
