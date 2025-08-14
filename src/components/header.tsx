'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle, BarChartBig, Upload, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

type AppHeaderProps = {
  onAddTradeClick: () => void;
  onImportClick: () => void;
};


export default function AppHeader({ onAddTradeClick, onImportClick }: AppHeaderProps) {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center space-x-4 px-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-2 items-center">
            <BarChartBig className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Trade Insights</h1>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {user && (
            <>
              <Button variant="outline" onClick={onImportClick}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import
              </Button>
              <Button onClick={onAddTradeClick}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Trade
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
