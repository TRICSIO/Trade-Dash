
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, onSnapshot, updateDoc, setDoc, getDoc, FirestoreError } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Trade, AccountSettings, UserData, AccountTransaction } from '@/lib/types';
import { useToast } from './use-toast';
import { useTranslation } from './use-translation';
import { isEqual } from 'lodash';

const sortTrades = (trades: Trade[]) => {
    return trades.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
};

function useFirestoreTrades(userId?: string) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [startingBalances, setStartingBalances] = useState<Record<string, number>>({});
  const [accountSettings, setAccountSettings] = useState<AccountSettings>({});
  const [displayName, setDisplayName] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Record<string, AccountTransaction[]>>({});
  const { toast } = useToast();
  const { t } = useTranslation();

  const updateUserDoc = useCallback(async (dataToUpdate: Partial<UserData>) => {
    if (!userId) return;
    
    const userDocRef = doc(db, 'users', userId);
    try {
      // Optimistically update local state first for better responsiveness
      if (dataToUpdate.trades && !isEqual(dataToUpdate.trades, trades)) {
        setTrades(sortTrades(dataToUpdate.trades));
      }
      if (dataToUpdate.startingBalances && !isEqual(dataToUpdate.startingBalances, startingBalances)) {
        setStartingBalances(dataToUpdate.startingBalances);
      }
      if (dataToUpdate.accountSettings && !isEqual(dataToUpdate.accountSettings, accountSettings)) {
        setAccountSettings(dataToUpdate.accountSettings);
      }
       if (dataToUpdate.displayName && dataToUpdate.displayName !== displayName) {
        setDisplayName(dataToUpdate.displayName);
      }
      if (dataToUpdate.transactions && !isEqual(dataToUpdate.transactions, transactions)) {
        setTransactions(dataToUpdate.transactions);
      }
      
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        await updateDoc(userDocRef, dataToUpdate);
      } else {
        // Create the document if it doesn't exist.
        await setDoc(userDocRef, dataToUpdate, { merge: true });
      }
    } catch (error) {
      console.error("Error saving data to Firestore:", error);
      toast({ title: t('error'), description: "Could not save changes to the cloud.", variant: 'destructive'});
       // TODO: Revert optimistic updates on failure
    }
  }, [userId, toast, t, trades, startingBalances, accountSettings, displayName, transactions]);


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
              entryDate: t.entryDate?.seconds ? new Date(t.entryDate.seconds * 1000) : new Date(t.entryDate),
              exitDate: t.exitDate?.seconds ? new Date(t.exitDate.seconds * 1000) : (t.exitDate ? new Date(t.exitDate) : undefined),
            }));
            
            if (!isEqual(tradesFromDb, trades)) {
              setTrades(sortTrades(tradesFromDb));
            }
            if (!isEqual(data.startingBalances, startingBalances)) {
              setStartingBalances(data.startingBalances || {});
            }
            if (!isEqual(data.accountSettings, accountSettings)) {
              setAccountSettings(data.accountSettings || {});
            }
            if (data.displayName !== displayName) {
              setDisplayName(data.displayName);
            }
            
            const transactionsFromDb = data.transactions || {};
            Object.keys(transactionsFromDb).forEach(acc => {
                transactionsFromDb[acc] = (transactionsFromDb[acc] || []).map((t: any) => ({
                    ...t,
                    date: t.date?.seconds ? new Date(t.date.seconds * 1000) : new Date(t.date),
                }));
            });
            if (!isEqual(transactionsFromDb, transactions)) {
                setTransactions(transactionsFromDb);
            }

        } else {
            console.log("No user document, it will be created on the first data modification.");
        }
        setLoading(false);
    }, (error) => {
        console.error("Error fetching data from Firestore:", error);
        toast({ title: "Error", description: "Could not load data from the cloud.", variant: 'destructive'});
        setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, toast, t]); // Removed dependencies that are updated inside to avoid loops

  const handleSetTrades = useCallback((newTrades: Trade[]) => {
    updateUserDoc({ trades: newTrades });
  }, [updateUserDoc]);
  
  const handleSetStartingBalances = useCallback((newBalances: Record<string, number>) => {
    updateUserDoc({ startingBalances: newBalances });
  }, [updateUserDoc]);

  const handleSetAccountSettings = useCallback((newSettings: AccountSettings) => {
    updateUserDoc({ accountSettings: newSettings });
  }, [updateUserDoc]);

  const handleSetDisplayName = useCallback((newName: string) => {
      updateUserDoc({ displayName: newName });
      toast({ title: t('save'), description: t('profileSettingsDescription') });
  }, [updateUserDoc, toast, t]);
  
  const handleAddNewAccount = useCallback(async (accountName: string, balance: number) => {
    if (!userId) return;
    const trimmedName = accountName.trim();
    if (!trimmedName) {
      toast({ title: t('accountNameRequired'), variant: 'destructive' });
      return;
    }
    
    const existingAccounts = Object.keys(accountSettings);
    if (existingAccounts.includes(trimmedName)) {
      toast({ title: t('accountExists'), variant: 'destructive' });
      return;
    }
    
    const newBalances = { ...startingBalances, [trimmedName]: balance };
    const newSettings = { ...accountSettings, [trimmedName]: { color: '#ffffff', accountNickname: trimmedName, accountProvider: '', accountNumber: '' } };
    
    await updateUserDoc({ 
      startingBalances: newBalances,
      accountSettings: newSettings,
    });
    
    toast({ title: t('save'), description: `Account '${trimmedName}' has been added.` });
  }, [userId, accountSettings, startingBalances, t, toast, updateUserDoc]);
  
  const handleSetTransactionsForAccount = useCallback((account: string, newTransactions: AccountTransaction[]) => {
    const updatedTransactions = { ...transactions, [account]: newTransactions };
    updateUserDoc({ transactions: updatedTransactions });
  }, [transactions, updateUserDoc]);

  const allAccounts = useMemo(() => {
    const accountsFromTrades = trades.map(t => t.account);
    const accountsFromBalances = Object.keys(startingBalances);
    const accountsFromSettings = Object.keys(accountSettings);
    return Array.from(new Set([
      ...accountsFromTrades,
      ...accountsFromBalances,
      ...accountsFromSettings,
    ]));
  }, [trades, startingBalances, accountSettings]);


  return { 
      trades, 
      startingBalances, 
      accountSettings, 
      displayName,
      loading,
      transactions,
      allAccounts,
      setTrades: handleSetTrades, 
      setStartingBalances: handleSetStartingBalances, 
      setAccountSettings: handleSetAccountSettings,
      setDisplayName: handleSetDisplayName,
      addAccount: handleAddNewAccount,
      setTransactionsForAccount: handleSetTransactionsForAccount,
    };
}

export default useFirestoreTrades;
