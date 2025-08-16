'use client';

import { useState } from 'react';
import type { AccountSettings } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';

type AccountSettingsDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  startingBalances: Record<string, number>;
  accountSettings: AccountSettings;
  onStartingBalancesChange: (balances: Record<string, number>) => void;
  onAccountSettingsChange: (settings: AccountSettings) => void;
};

export default function AccountSettingsDialog({
  isOpen,
  onOpenChange,
  startingBalances,
  accountSettings,
  onStartingBalancesChange,
  onAccountSettingsChange,
}: AccountSettingsDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [newAccountName, setNewAccountName] = useState('');

  const handleBalanceChange = (accountName: string, value: string) => {
    const newBalances = { ...startingBalances, [accountName]: Number(value) };
    onStartingBalancesChange(newBalances);
  };

  const handleColorChange = (accountName: string, color: string) => {
    const newSettings = {
      ...accountSettings,
      [accountName]: { ...accountSettings[accountName], color },
    };
    onAccountSettingsChange(newSettings);
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
    onStartingBalancesChange(newBalances);
    onAccountSettingsChange(newSettings);
    setNewAccountName('');
  }

  const allAccounts = Array.from(new Set(Object.keys(startingBalances)));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('accountSettings')}</DialogTitle>
          <DialogDescription>
            {t('accountSettingsDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto px-1">
          {allAccounts.map((account) => (
            <div key={account} className="space-y-4 rounded-md border p-4">
              <h4 className="font-semibold">{account}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
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
                  <Label htmlFor={`color-${account}`}>{t('accountColor')}</Label>
                  <Input
                    id={`color-${account}`}
                    type="color"
                    value={accountSettings[account]?.color || '#000000'}
                    onChange={(e) => handleColorChange(account, e.target.value)}
                    className="p-1 h-10 w-full"
                  />
                </div>
              </div>
            </div>
          ))}
           <form onSubmit={handleAddNewAccount} className="space-y-4 rounded-md border p-4">
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
                        <PlusCircle className="h-4 w-4" />
                        <span className="sr-only">{t('add')}</span>
                    </Button>
                </div>
            </form>
        </div>
         <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
