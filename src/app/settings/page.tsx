
'use client';

import { useState } from 'react';
import useFirestoreTrades from '@/hooks/use-firestore-trades';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileDown, Plus } from 'lucide-react';
import ProtectedRoute from '@/components/protected-route';
import AppHeader from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import { useFontSize } from '@/context/font-size-context';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/context/language-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function SettingsPage() {
  const { user } = useAuth();
  const { trades, startingBalances, accountSettings, setStartingBalances, setAccountSettings } = useFirestoreTrades(user?.uid);
  const { t } = useTranslation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const { language, setLanguage } = useLanguage();
  const [newAccountName, setNewAccountName] = useState('');

  const fontSizeMapping: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];

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

  const handleBackup = () => {
    try {
        const backupData = {
            trades,
            startingBalances,
            accountSettings
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

  const allAccounts = Array.from(new Set(Object.keys(startingBalances)));

  return (
    <div className="flex flex-col min-h-screen bg-background">
       <AppHeader onAddTradeClick={() => {}} onImportClick={() => {}} />
       <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
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
