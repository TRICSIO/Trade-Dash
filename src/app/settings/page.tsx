
'use client';

import { useState, useEffect, useCallback } from 'react';
import useFirestoreTrades from '@/hooks/use-firestore-trades';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileDown, Plus, Mail, Save, Settings2 } from 'lucide-react';
import ProtectedRoute from '@/components/protected-route';
import AppHeader from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import { useFontSize } from '@/context/font-size-context';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/context/language-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AccountSettings } from '@/lib/types';
import { isEqual } from 'lodash';
import AccountTransactionsDialog from '@/components/account-transactions-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


function SettingsPage() {
  const { user } = useAuth();
  const { 
    startingBalances: initialStartingBalances, 
    accountSettings: initialAccountSettings,
    displayName: initialDisplayName, 
    transactions,
    allAccounts,
    trades,
    setStartingBalances, 
    setAccountSettings,
    setDisplayName,
    addAccount,
    setTransactionsForAccount,
  } = useFirestoreTrades(user?.uid);

  const { t } = useTranslation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const { language, setLanguage } = useLanguage();
  
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState<number>(0);

  const [isTransactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [selectedAccountForTransactions, setSelectedAccountForTransactions] = useState<string | null>(null);
  
  // Local state for edits
  const [currentDisplayName, setCurrentDisplayName] = useState(initialDisplayName || '');
  const [localStartingBalances, setLocalStartingBalances] = useState(initialStartingBalances);
  const [localAccountSettings, setLocalAccountSettings] = useState(initialAccountSettings);

  const [hasProfileChanges, setHasProfileChanges] = useState(false);
  const [hasAccountChanges, setHasAccountChanges] = useState(false);

  useEffect(() => {
    if (initialDisplayName) {
      setCurrentDisplayName(initialDisplayName);
    }
  }, [initialDisplayName]);
  
  useEffect(() => {
    setLocalStartingBalances(initialStartingBalances);
  }, [initialStartingBalances]);

  useEffect(() => {
    setLocalAccountSettings(initialAccountSettings);
  }, [initialAccountSettings]);

  useEffect(() => {
    setHasProfileChanges(currentDisplayName !== initialDisplayName);
  }, [currentDisplayName, initialDisplayName]);

  useEffect(() => {
    setHasAccountChanges(!isEqual(localStartingBalances, initialStartingBalances) || !isEqual(localAccountSettings, initialAccountSettings));
  }, [localStartingBalances, localAccountSettings, initialStartingBalances, initialAccountSettings]);


  const fontSizeMapping: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];

  const handleBalanceChange = (accountName: string, value: string) => {
    setLocalStartingBalances(prev => ({...prev, [accountName]: Number(value)}));
  };

  const handleSettingChange = (accountName: string, field: keyof AccountSettings[string], value: string) => {
    setLocalAccountSettings(prev => ({
      ...prev,
      [accountName]: { ...prev[accountName], [field]: value },
    }));
  };
  
  const handleAddNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAccountName.trim()) {
      addAccount(newAccountName.trim(), newAccountBalance);
      setNewAccountName('');
      setNewAccountBalance(0);
    }
  }

  const handleBackup = () => {
    try {
        const backupData = {
            trades,
            startingBalances: initialStartingBalances,
            accountSettings: initialAccountSettings,
        };
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const date = new Date().toISOString().slice(0, 10);
        link.download = `trade-dash-backup-${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({
            title: t('backupSuccessful'),
            description: t('yourDataHasBeenDownloaded'),
        });
    } catch (error) {
        toast({
            title: t('backupFailed'),
            description: t('couldNotCreateBackup'),
            variant: "destructive",
        });
    }
  };

  const handleDisplayNameSave = () => {
    if (currentDisplayName.trim()) {
      setDisplayName(currentDisplayName.trim());
    } else {
      toast({ title: 'Error', description: 'Display name cannot be empty.', variant: 'destructive' });
    }
  };
  
  const handleAccountSettingsSave = () => {
    setStartingBalances(localStartingBalances);
    setAccountSettings(localAccountSettings);
    toast({ title: 'Success', description: 'Account settings have been saved.' });
  }

  const handleOpenTransactionDialog = (accountName: string) => {
      setSelectedAccountForTransactions(accountName);
      setTransactionDialogOpen(true);
  }

  return (
    <>
    <div className="flex flex-col min-h-screen bg-background">
       <AppHeader onAddTradeClick={() => {}} onImportClick={() => {}} />
       <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>{t('profileSettings')}</CardTitle>
                    <CardDescription>{t('profileSettingsDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="displayName">{t('displayName')}</Label>
                        <Input
                            id="displayName"
                            value={currentDisplayName}
                            onChange={(e) => setCurrentDisplayName(e.target.value)}
                            placeholder="Your display name"
                        />
                    </div>
                </CardContent>
                 {hasProfileChanges && (
                    <CardFooter>
                        <Button onClick={handleDisplayNameSave}><Save className="mr-2 h-4 w-4"/> {t('saveChanges')}</Button>
                    </CardFooter>
                )}
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('accountSettings')}</CardTitle>
                    <CardDescription>{t('accountSettingsDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1">
                    <Accordion type="single" collapsible className="w-full">
                      {allAccounts.map((account) => (
                          <AccordionItem value={account} key={account}>
                              <AccordionTrigger>
                                <div className="flex justify-between items-center w-full pr-4">
                                  <h4 className="font-semibold">{localAccountSettings[account]?.accountNickname || account}</h4>
                                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenTransactionDialog(account); }}>
                                      <Settings2 className="mr-2 h-4 w-4"/> {t('manageAccount')}
                                  </Button>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-4 rounded-md border p-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                                        <div className="space-y-2">
                                        <Label htmlFor={`balance-${account}`}>{t('startingBalance')}</Label>
                                        <Input
                                            id={`balance-${account}`}
                                            type="number"
                                            value={localStartingBalances[account] || 0}
                                            onChange={(e) => handleBalanceChange(account, e.target.value)}
                                            placeholder="e.g., 10000"
                                        />
                                        </div>
                                        <div className="space-y-2">
                                        <Label htmlFor={`nickname-${account}`}>{t('accountNickname')}</Label>
                                        <Input
                                            id={`nickname-${account}`}
                                            type="text"
                                            value={localAccountSettings[account]?.accountNickname || ''}
                                            onChange={(e) => handleSettingChange(account, 'accountNickname', e.target.value)}
                                            placeholder="e.g., My Roth IRA"
                                        />
                                        </div>
                                        <div className="space-y-2">
                                        <Label htmlFor={`provider-${account}`}>{t('accountProvider')}</Label>
                                        <Input
                                            id={`provider-${account}`}
                                            type="text"
                                            value={localAccountSettings[account]?.accountProvider || ''}
                                            onChange={(e) => handleSettingChange(account, 'accountProvider', e.target.value)}
                                            placeholder="e.g., Fidelity"
                                        />
                                        </div>
                                        <div className="space-y-2">
                                        <Label htmlFor={`number-${account}`}>{t('accountNumber')}</Label>
                                        <Input
                                            id={`number-${account}`}
                                            type="text"
                                            value={localAccountSettings[account]?.accountNumber || ''}
                                            onChange={(e) => handleSettingChange(account, 'accountNumber', e.target.value)}
                                            placeholder="e.g., X12345678"
                                        />
                                        </div>
                                        <div className="space-y-2">
                                        <Label htmlFor={`color-${account}`}>{t('accountColor')}</Label>
                                        <Input
                                            id={`color-${account}`}
                                            type="color"
                                            value={localAccountSettings[account]?.color || '#ffffff'}
                                            onChange={(e) => handleSettingChange(account, 'color', e.target.value)}
                                            className="p-1 h-10 w-full"
                                        />
                                        </div>
                                    </div>
                                </div>
                              </AccordionContent>
                          </AccordionItem>
                      ))}
                    </Accordion>

                    <form onSubmit={handleAddNewAccount} className="space-y-4 rounded-md border p-4 mt-6">
                            <h4 className="font-semibold">{t('addNewAccount')}</h4>
                            <div className="flex flex-col sm:flex-row items-end gap-2">
                                <div className="flex-grow space-y-2">
                                    <Label htmlFor="new-account-name">{t('accountName')}</Label>
                                    <Input
                                        id="new-account-name"
                                        value={newAccountName}
                                        onChange={(e) => setNewAccountName(e.target.value)}
                                        placeholder="e.g., Savings"
                                        required
                                    />
                                </div>
                                <div className="flex-grow space-y-2">
                                    <Label htmlFor="new-account-balance">{t('startingBalance')}</Label>
                                    <Input
                                        id="new-account-balance"
                                        type="number"
                                        value={newAccountBalance}
                                        onChange={(e) => setNewAccountBalance(Number(e.target.value))}
                                        placeholder="e.g., 10000"
                                        required
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
                {hasAccountChanges && (
                    <CardFooter>
                        <Button onClick={handleAccountSettingsSave}><Save className="mr-2 h-4 w-4"/> {t('saveChanges')}</Button>
                    </CardFooter>
                )}
            </Card>

            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('themeSettings')}</CardTitle>
                        <CardDescription>{t('themeSettingsDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Select value={theme} onValueChange={setTheme}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('theme')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">{t('light')}</SelectItem>
                                <SelectItem value="dark">{t('dark')}</SelectItem>
                                <SelectItem value="system">{t('system')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('languageSettings')}</CardTitle>
                        <CardDescription>{t('languageSettingsDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('language')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="es">Español</SelectItem>
                                <SelectItem value="fr">Français</SelectItem>
                                <SelectItem value="de">Deutsch</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>{t('fontSize')}</CardTitle>
                    <CardDescription>{t('fontSizeDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{t('small')}</span>
                        <Slider
                            value={[fontSizeMapping.indexOf(fontSize)]}
                            min={0}
                            max={2}
                            step={1}
                            onValueChange={(value) => setFontSize(fontSizeMapping[value[0]])}
                        />
                        <span className="text-lg text-muted-foreground">{t('large')}</span>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>{t('dataManagement')}</CardTitle>
                    <CardDescription>{t('dataManagementDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" className="w-full sm:w-auto justify-start" onClick={handleBackup}>
                       <FileDown className="mr-2 h-4 w-4" /> {t('backupData')}
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>{t('contactDeveloper')}</CardTitle>
                    <CardDescription>{t('contactDeveloperDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <a href="mailto:pbolouvi@gmail.com?subject=Trade-Dash" className="inline-flex items-center">
                        <Button variant="outline" className="w-full sm:w-auto justify-start">
                           <Mail className="mr-2 h-4 w-4" /> {t('contactDeveloper')}
                        </Button>
                    </a>
                </CardContent>
            </Card>
        </div>
       </main>
    </div>
    {selectedAccountForTransactions && (
        <AccountTransactionsDialog
            isOpen={isTransactionDialogOpen}
            onOpenChange={setTransactionDialogOpen}
            accountName={selectedAccountForTransactions}
            transactions={transactions[selectedAccountForTransactions] || []}
            onSaveTransactions={(newTransactions) => setTransactionsForAccount(selectedAccountForTransactions, newTransactions)}
        />
    )}
    </>
  );
}


export default function Settings() {
    return (
        <ProtectedRoute>
            <SettingsPage />
        </ProtectedRoute>
    )
}
