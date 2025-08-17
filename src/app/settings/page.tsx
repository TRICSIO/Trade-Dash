'use client';

import { useState } from 'react';
import useFirestoreTrades from '@/hooks/use-firestore-trades';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Moon, Plus, Sun } from 'lucide-react';
import ProtectedRoute from '@/components/protected-route';
import AppHeader from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useTheme } from 'next-themes';

function SettingsPage() {
  const { user } = useAuth();
  const { startingBalances, accountSettings, setStartingBalances, setAccountSettings } = useFirestoreTrades(user?.uid);
  const { t } = useTranslation();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const [newAccountName, setNewAccountName] = useState('');

  const handleBalanceChange = (accountName: string, value: string) => {
    const newBalances = { ...startingBalances, [accountName]: Number(value) };
    setStartingBalances(newBalances);
  };

  const handleSettingChange = (accountName: string, field: keyof (typeof accountSettings)[string], value: string) => {
    const newSettings = {
      ...accountSettings,
      [accountName]: { ...accountSettings[accountName], [field]: value },
    };
    setAccountSettings(newSettings);
  };
  
  const handleAddNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) {
        toast({ title: t('accountNameRequired'), variant: 'destructive'});
        return;
    }
    if (Object.keys(startingBalances).includes(newAccountName.trim())) {
        toast({ title: t('accountExists'), variant: 'destructive'});
        return;
    }
    const newBalances = { ...startingBalances, [newAccountName]: 0 };
    const newSettings = { ...accountSettings, [newAccountName]: { color: '#ffffff' } };
    setStartingBalances(newBalances);
    setAccountSettings(newSettings);
    setNewAccountName('');
  }

  const allAccounts = Array.from(new Set(Object.keys(startingBalances)));

  return (
    <div className="flex flex-col min-h-screen bg-background">
       <AppHeader onAddTradeClick={() => {}} onImportClick={() => {}} onBackupClick={() => {}} />
       <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="grid gap-8 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>{t('accountSettings')}</CardTitle>
                    <CardDescription>{t('accountSettingsDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1">
                    {allAccounts.map((account) => (
                        <div key={account} className="space-y-4 rounded-md border p-4">
                        <h4 className="font-semibold">{account}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                            <div className="space-y-2">
                            <Label htmlFor={`balance-${account}`}>{t('startingBalance')}</Label>
                            <Input
                                id={`balance-${account}`}
                                type="number"
                                value={startingBalances[account] || 0}
                                onChange={(e) => handleBalanceChange(account, e.target.value)}
                                placeholder="e.g., 10000"
                            />
                            </div>
                            <div className="space-y-2">
                            <Label htmlFor={`nickname-${account}`}>{t('accountNickname')}</Label>
                            <Input
                                id={`nickname-${account}`}
                                type="text"
                                value={accountSettings[account]?.accountNickname || ''}
                                onChange={(e) => handleSettingChange(account, 'accountNickname', e.target.value)}
                                placeholder="e.g., My Roth IRA"
                            />
                            </div>
                            <div className="space-y-2">
                            <Label htmlFor={`provider-${account}`}>{t('accountProvider')}</Label>
                            <Input
                                id={`provider-${account}`}
                                type="text"
                                value={accountSettings[account]?.accountProvider || ''}
                                onChange={(e) => handleSettingChange(account, 'accountProvider', e.target.value)}
                                placeholder="e.g., Fidelity"
                            />
                            </div>
                            <div className="space-y-2">
                            <Label htmlFor={`number-${account}`}>{t('accountNumber')}</Label>
                            <Input
                                id={`number-${account}`}
                                type="text"
                                value={accountSettings[account]?.accountNumber || ''}
                                onChange={(e) => handleSettingChange(account, 'accountNumber', e.target.value)}
                                placeholder="e.g., X12345678"
                            />
                            </div>
                            <div className="space-y-2">
                            <Label htmlFor={`color-${account}`}>{t('accountColor')}</Label>
                            <Input
                                id={`color-${account}`}
                                type="color"
                                value={accountSettings[account]?.color || '#ffffff'}
                                onChange={(e) => handleSettingChange(account, 'color', e.target.value)}
                                className="p-1 h-10 w-full"
                            />
                            </div>
                        </div>
                        </div>
                    ))}
                    <form onSubmit={handleAddNewAccount} className="space-y-4 rounded-md border p-4 mt-6">
                            <h4 className="font-semibold">{t('addNewAccount')}</h4>
                            <div className="flex items-end gap-2">
                                <div className="flex-grow space-y-2">
                                    <Label htmlFor="new-account-name">{t('accountName')}</Label>
                                    <Input
                                        id="new-account-name"
                                        value={newAccountName}
                                        onChange={(e) => setNewAccountName(e.target.value)}
                                        placeholder="e.g., Savings"
                                    />
                                </div>
                                <Button type="submit" size="icon">
                                    <Plus className="h-4 w-4" />
                                    <span className="sr-only">{t('add')}</span>
                                </Button>
                            </div>
                        </form>
                    </div>
                </CardContent>
            </Card>
             <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('themeSettings')}</CardTitle>
                        <CardDescription>{t('themeSettingsDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button variant="outline" className="w-full justify-start" onClick={() => setTheme("light")}>
                           <Sun className="mr-2 h-4 w-4" /> {t('light')}
                        </Button>
                         <Button variant="outline" className="w-full justify-start" onClick={() => setTheme("dark")}>
                           <Moon className="mr-2 h-4 w-4" /> {t('dark')}
                        </Button>
                         <Button variant="outline" className="w-full justify-start" onClick={() => setTheme("system")}>
                           <Sun className="mr-2 h-4 w-4" />/{' '}<Moon className="ml-1 mr-2 h-4 w-4" /> {t('system')}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
       </main>
    </div>
  );
}


export default function Settings() {
    return (
        <ProtectedRoute>
            <SettingsPage />
        </ProtectedRoute>
    )
}
