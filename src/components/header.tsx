
'use client';

import { Button } from '@/components/ui/button';
import { Plus, CandlestickChart, FileUp, LogOut, Cog, Menu, Home, BarChart2, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { useTranslation } from '@/hooks/use-translation';
import useFirestoreTrades from '@/hooks/use-firestore-trades';


type AppHeaderProps = {
  onAddTradeClick: () => void;
  onImportClick: () => void;
};


export default function AppHeader({ onAddTradeClick, onImportClick }: AppHeaderProps) {
  const { user } = useAuth();
  const { displayName } = useFirestoreTrades(user?.uid);
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center space-x-4 px-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-2 items-center">
            <CandlestickChart className="h-8 w-8 text-primary" />
             <div className="flex items-baseline gap-2">
                <Link href="/" className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Trade-Dash
                </Link>
                <span className="text-sm italic">by TRICSIO</span>
            </div>
        </div>
        <div className="hidden sm:flex flex-1 items-center justify-end space-x-2">
          {user && (
            <>
               <span className="text-sm text-muted-foreground">{t('welcome', { name: displayName })}</span>
               <div className="border-l h-6 mx-2"></div>
               <Button variant="ghost" asChild>
                <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    {t('dashboard')}
                </Link>
              </Button>
               <Button variant="ghost" asChild>
                <Link href="/analytics">
                    <BarChart2 className="mr-2 h-4 w-4" />
                    {t('analytics')}
                </Link>
              </Button>
               <Button variant="ghost" asChild>
                <Link href="/how-to">
                    <BookOpen className="mr-2 h-4 w-4" />
                    {t('howTo')}
                </Link>
              </Button>
              <Button variant="outline" onClick={onImportClick}>
                  <FileUp className="mr-2 h-4 w-4" />
                  {t('import')}
              </Button>
              <Button onClick={onAddTradeClick}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('addTrade')}
              </Button>
               <Button variant="ghost" size="icon" asChild>
                 <Link href="/settings">
                    <Cog className="h-4 w-4" />
                    <span className="sr-only">{t('settings')}</span>
                 </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="sr-only">{t('logout')}</span>
              </Button>
            </>
          )}
        </div>
        <div className="sm:hidden flex items-center">
             {user && (
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">{t('openMenu')}</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <div className="py-4">
                           <span className="text-sm font-medium text-muted-foreground px-4">{t('welcome', { name: displayName })}</span>
                        </div>
                        <div className="border-t -mx-6 my-2"></div>
                        <div className="grid gap-4 py-4">
                              <SheetClose asChild>
                                <Button variant="ghost" asChild className="w-full justify-start">
                                    <Link href="/">
                                        <Home className="mr-2 h-4 w-4" />
                                        {t('dashboard')}
                                    </Link>
                                </Button>
                             </SheetClose>
                             <SheetClose asChild>
                                <Button variant="ghost" asChild className="w-full justify-start">
                                    <Link href="/analytics">
                                        <BarChart2 className="mr-2 h-4 w-4" />
                                        {t('analytics')}
                                    </Link>
                                </Button>
                             </SheetClose>
                             <SheetClose asChild>
                                <Button variant="ghost" asChild className="w-full justify-start">
                                    <Link href="/how-to">
                                        <BookOpen className="mr-2 h-4 w-4" />
                                        {t('howTo')}
                                    </Link>
                                </Button>
                             </SheetClose>
                             <SheetClose asChild>
                                <Button variant="outline" onClick={onImportClick} className="w-full justify-start">
                                    <FileUp className="mr-2 h-4 w-4" />
                                    {t('import')}
                                </Button>
                             </SheetClose>
                              <SheetClose asChild>
                                <Button variant="outline" asChild className="w-full justify-start">
                                     <Link href="/settings">
                                        <Cog className="mr-2 h-4 w-4" />
                                        {t('settings')}
                                     </Link>
                                </Button>
                             </SheetClose>
                             <SheetClose asChild>
                                <Button onClick={onAddTradeClick} className="w-full justify-start">
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t('addTrade')}
                                </Button>
                             </SheetClose>
                             <div className="border-t -mx-6 my-2"></div>
                             <SheetClose asChild>
                                <Button variant="ghost" onClick={handleLogout} className="w-full justify-start">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    {t('logout')}
                                </Button>
                             </SheetClose>
                        </div>
                    </SheetContent>
                </Sheet>
             )}
        </div>
      </div>
    </header>
  );
}
