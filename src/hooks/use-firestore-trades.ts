
'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Trade, AccountSettings, UserData } from '@/lib/types';
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

const sortTrades = (trades: Trade[]) => {
    return trades.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
};

function useFirestoreTrades(userId?: string) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [startingBalances, setStartingBalances] = useState<Record<string, number>>({});
  const [accountSettings, setAccountSettings] = useState<AccountSettings>({});
  const [displayName, setDisplayName] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const saveDataToFirestore = useCallback(
    async (dataToSave: Partial<UserData>) => {
      if (!userId) return;
      try {
        const userDocRef = doc(db, 'users', userId);
        
        // Ensure we don't accidentally overwrite with undefined
        const finalData = Object.fromEntries(Object.entries(dataToSave).filter(([_, v]) => v !== undefined));

        await setDoc(userDocRef, finalData, { merge: true });

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
            const data = docSnap.data() as UserData;
            const tradesFromDb = (data.trades || []).map((t: any) => ({
              ...t,
              entryDate: t.entryDate ? new Date(t.entryDate) : new Date(),
              exitDate: t.exitDate ? new Date(t.exitDate) : undefined,
            }));
            setTrades(sortTrades(tradesFromDb));
            setStartingBalances(data.startingBalances || {});
            setAccountSettings(data.accountSettings || {});
            setDisplayName(data.displayName);
        } else {
            console.log("No such document! A new one will be created on first save.");
            setTrades([]);
            setStartingBalances({});
            setAccountSettings({});
            setDisplayName(undefined);
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
    const sortedTrades = sortTrades(updatedTrades);
    setTrades(sortedTrades);
    const tradesToStore = sortedTrades.map(t => ({
      ...t,
      entryDate: new Date(t.entryDate).toISOString(),
      exitDate: t.exitDate ? new Date(t.exitDate).toISOString() : undefined,
    }));
    debouncedSave({ trades: tradesToStore });
  }
  
  const handleSetStartingBalances = (newBalances: Record<string, number> | ((val: Record<string, number>) => Record<string, number>)) => {
    const updatedBalances = newBalances instanceof Function ? newBalances(startingBalances) : newBalances;
    setStartingBalances(updatedBalances);
    debouncedSave({ startingBalances: updatedBalances });
  }

  const handleSetAccountSettings = (newSettings: AccountSettings | ((val: AccountSettings) => AccountSettings)) => {
    const updatedSettings = newSettings instanceof Function ? newSettings(accountSettings) : newSettings;
    setAccountSettings(updatedSettings);
    debouncedSave({ accountSettings: updatedSettings });
  }

  const handleSetDisplayName = (newName: string) => {
      setDisplayName(newName);
      saveDataToFirestore({ displayName: newName });
      toast({ title: 'Success', description: 'Your display name has been updated.' });
  }

  const handleAddNewAccount = (accountName: string) => {
    if (!accountName.trim()) {
      toast({ title: "Account name is required.", variant: 'destructive' });
      return;
    }
    if (Object.keys(startingBalances).includes(accountName.trim())) {
      toast({ title: "An account with this name already exists.", variant: 'destructive' });
      return;
    }

    const newBalances = { ...startingBalances, [accountName]: 0 };
    const newSettings = { ...accountSettings, [accountName]: { color: '#ffffff' } };

    setStartingBalances(newBalances);
    setAccountSettings(newSettings);
    
    debouncedSave({ 
      startingBalances: newBalances,
      accountSettings: newSettings,
    });
  }


  return { 
      trades, 
      startingBalances, 
      accountSettings, 
      displayName,
      setTrades: handleSetTrades, 
      setStartingBalances: handleSetStartingBalances, 
      setAccountSettings: handleSetAccountSettings,
      setDisplayName: handleSetDisplayName,
      addAccount: handleAddNewAccount,
      loading 
    };
}

export default useFirestoreTrades;
