
'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, setDoc, getDoc, FirestoreError } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Trade, AccountSettings, UserData, AccountTransaction } from '@/lib/types';
import { useToast } from './use-toast';
import { useTranslation } from './use-translation';

const sortTrades = (trades: Trade[]) => {
    return trades.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
};

function useFirestoreTrades(userId?: string) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [startingBalances, setStartingBalances] = useState<Record<string, number>>({});
  const [accountSettings, setAccountSettings] = useState<AccountSettings>({});
  const [displayName, setDisplayName] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [hasSeenWelcomeMessage, setHasSeenWelcomeMessage] = useState(false);
  const [transactions, setTransactions] = useState<Record<string, AccountTransaction[]>>({});
  const { toast } = useToast();
  const { t } = useTranslation();

  const updateUserDoc = useCallback(async (dataToUpdate: Partial<UserData>) => {
    if (!userId) return;
    
    const userDocRef = doc(db, 'users', userId);
    
    try {
        await updateDoc(userDocRef, dataToUpdate);
    } catch (error) {
       if ((error as FirestoreError).code === 'not-found') {
          try {
            const docSnap = await getDoc(userDocRef);
            if (!docSnap.exists()) {
                const initialData = await getInitialUserData(userId);
                await setDoc(userDocRef, { ...initialData, ...dataToUpdate });
            } else {
                await updateDoc(userDocRef, dataToUpdate);
            }
          } catch (e) {
            console.error("Error creating document after not-found error:", e);
            toast({ title: "Error", description: "Could not create user data.", variant: 'destructive'});
          }
       } else {
            console.error("Error saving data to Firestore:", error);
            toast({ title: "Error", description: "Could not save changes to the cloud.", variant: 'destructive'});
       }
    }
  }, [userId, toast]);


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
            setTrades(sortTrades(tradesFromDb));
            setStartingBalances(data.startingBalances || {});
            setAccountSettings(data.accountSettings || {});
            setDisplayName(data.displayName);
            setHasSeenWelcomeMessage(data.hasSeenWelcomeMessage || false);
            
            const transactionsFromDb = data.transactions || {};
            Object.keys(transactionsFromDb).forEach(acc => {
                transactionsFromDb[acc] = (transactionsFromDb[acc] || []).map((t: any) => ({
                    ...t,
                    date: t.date?.seconds ? new Date(t.date.seconds * 1000) : new Date(t.date),
                }));
            });
            setTransactions(transactionsFromDb);

        } else {
            console.log("No user document, it will be created on the first data modification.");
            setHasSeenWelcomeMessage(false);
        }
        setLoading(false);
    }, (error) => {
        console.error("Error fetching data from Firestore:", error);
        toast({ title: "Error", description: "Could not load data from the cloud.", variant: 'destructive'});
        setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, toast]);

  const getInitialUserData = async (userId: string) => {
      const userDocRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
          return docSnap.data() as UserData;
      }
      return {
          trades: [],
          startingBalances: {},
          accountSettings: {},
          transactions: {},
          hasSeenWelcomeMessage: false,
      };
  };

  const handleSetTrades = (newTrades: Trade[]) => {
    const sorted = sortTrades(newTrades);
    updateUserDoc({ trades: sorted });
  }
  
  const handleSetStartingBalances = (newBalances: Record<string, number>) => {
    updateUserDoc({ startingBalances: newBalances });
  }

  const handleSetAccountSettings = (newSettings: AccountSettings) => {
    updateUserDoc({ accountSettings: newSettings });
  }

  const handleSetDisplayName = (newName: string) => {
      updateUserDoc({ displayName: newName });
      toast({ title: 'Success', description: 'Your display name has been updated.' });
  }

  const handleMarkWelcomeMessageAsSeen = async () => {
    updateUserDoc({ hasSeenWelcomeMessage: true });
  }
  
  const handleAddNewAccount = async (accountName: string, balance: number) => {
    if (!accountName.trim()) {
      toast({ title: t('accountNameRequired'), variant: 'destructive' });
      return;
    }
    const trimmedName = accountName.trim();
    
    if (Object.keys(accountSettings).includes(trimmedName)) {
      toast({ title: t('accountExists'), variant: 'destructive' });
      return;
    }
    
    const newBalances = { ...startingBalances, [trimmedName]: balance };
    const newSettings = { ...accountSettings, [trimmedName]: { color: '#ffffff', accountNickname: trimmedName, accountProvider: '', accountNumber: '' } };
    
    await updateUserDoc({ 
      startingBalances: newBalances,
      accountSettings: newSettings,
    });
    toast({ title: 'Success', description: `Account '${trimmedName}' has been added.` });
  }
  
  const handleSetTransactionsForAccount = (account: string, newTransactions: AccountTransaction[]) => {
    const updatedTransactions = { ...transactions, [account]: newTransactions };
    updateUserDoc({ transactions: updatedTransactions });
  }


  return { 
      trades, 
      startingBalances, 
      accountSettings, 
      displayName,
      loading,
      hasSeenWelcomeMessage,
      transactions,
      setTrades: handleSetTrades, 
      setStartingBalances: handleSetStartingBalances, 
      setAccountSettings: handleSetAccountSettings,
      setDisplayName: handleSetDisplayName,
      addAccount: handleAddNewAccount,
      markWelcomeMessageAsSeen: handleMarkWelcomeMessageAsSeen,
      setTransactionsForAccount: handleSetTransactionsForAccount,
    };
}

export default useFirestoreTrades;
