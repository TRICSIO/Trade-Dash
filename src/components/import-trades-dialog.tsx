'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload } from 'lucide-react';

type ImportTradesDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onImport: (broker: string, file: File, account: string) => void;
  accounts: string[];
};

const brokers = ['Webull', 'Schwab', 'Moomoo', 'Sofi'];

export default function ImportTradesDialog({
  isOpen,
  onOpenChange,
  onImport,
  accounts,
}: ImportTradesDialogProps) {
  const [selectedBroker, setSelectedBroker] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleImportClick = () => {
    if (selectedBroker && selectedFile && selectedAccount) {
      onImport(selectedBroker, selectedFile, selectedAccount);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Trades</DialogTitle>
          <DialogDescription>
            Select your broker, account, and upload the trade history file (usually a CSV).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="broker-select" className="text-right">
              Broker
            </Label>
            <Select onValueChange={setSelectedBroker} value={selectedBroker}>
              <SelectTrigger id="broker-select" className="col-span-3">
                <SelectValue placeholder="Select a broker" />
              </SelectTrigger>
              <SelectContent>
                {brokers.map((broker) => (
                  <SelectItem key={broker} value={broker}>
                    {broker}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="account-import-select" className="text-right">
              Account
            </Label>
            <Select onValueChange={setSelectedAccount} value={selectedAccount}>
              <SelectTrigger id="account-import-select" className="col-span-3">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account} value={account}>
                    {account}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file-upload" className="text-right">
              File
            </Label>
            <Input
              id="file-upload"
              type="file"
              className="col-span-3"
              onChange={handleFileChange}
              accept=".csv"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleImportClick}
            disabled={!selectedBroker || !selectedFile || !selectedAccount}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
