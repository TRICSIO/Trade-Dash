'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle, BarChartBig, Upload, LogOut, Download, Moon, Sun, Languages } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu } from 'lucide-react';
import { useTheme } from '@/context/theme-provider';
import { useTranslation } from '@/hooks/use-translation';
import { useLanguage } from '@/context/language-context';


type AppHeaderProps = {
  onAddTradeClick: () => void;
  onImportClick: () => void;
  onBackupClick: () => void;
};


export default function AppHeader({ onAddTradeClick, onImportClick, onBackupClick }: AppHeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { setTheme } = useTheme();
  const { t } = useTranslation();
  const { setLanguage } = useLanguage();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center space-x-4 px-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-2 items-center">
            <BarChartBig className="h-8 w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Trade Insights <span className="hidden sm:inline-block text-xl sm:text-2xl font-normal text-muted-foreground">by TRICSIO</span>
            </h1>
        </div>
        <div className="hidden sm:flex flex-1 items-center justify-end space-x-2">
          {user && (
            <>
              <Button variant="outline" onClick={onBackupClick}>
                  <Download className="mr-2 h-4 w-4" />
                  {t('backup')}
              </Button>
              <Button variant="outline" onClick={onImportClick}>
                  <Upload className="mr-2 h-4 w-4" />
                  {t('import')}
              </Button>
              <Button onClick={onAddTradeClick}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('addTrade')}
              </Button>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Languages className="h-5 w-5" />
                    <span className="sr-only">{t('changeLanguage')}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLanguage("en")}>
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage("es")}>
                    Español
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">{t('toggleTheme')}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    {t('light')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    {t('dark')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    {t('system')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                        <div className="grid gap-4 py-4">
                             <SheetClose asChild>
                                <Button variant="outline" onClick={onBackupClick} className="w-full justify-start">
                                    <Download className="mr-2 h-4 w-4" />
                                    {t('backupData')}
                                </Button>
                             </SheetClose>
                             <SheetClose asChild>
                                <Button variant="outline" onClick={onImportClick} className="w-full justify-start">
                                    <Upload className="mr-2 h-4 w-4" />
                                    {t('import')}
                                </Button>
                             </SheetClose>
                             <SheetClose asChild>
                                <Button onClick={onAddTradeClick} className="w-full justify-start">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    {t('addTrade')}
                                </Button>
                             </SheetClose>
                             <div className="border-t -mx-6 my-2"></div>
                             <h4 className="px-2 text-sm font-medium text-muted-foreground">{t('language')}</h4>
                             <SheetClose asChild>
                                <Button variant="ghost" onClick={() => setLanguage("en")} className="w-full justify-start">
                                    English
                                </Button>
                             </SheetClose>
                             <SheetClose asChild>
                                <Button variant="ghost" onClick={() => setLanguage("es")} className="w-full justify-start">
                                    Español
                                </Button>
                             </SheetClose>
                             <div className="border-t -mx-6 my-2"></div>
                             <h4 className="px-2 text-sm font-medium text-muted-foreground">{t('theme')}</h4>
                              <SheetClose asChild>
                                 <Button variant="ghost" onClick={() => setTheme("light")} className="w-full justify-start">
                                    <Sun className="mr-2 h-4 w-4" />
                                    {t('light')}
                                </Button>
                              </SheetClose>
                              <SheetClose asChild>
                                 <Button variant="ghost" onClick={() => setTheme("dark")} className="w-full justify-start">
                                    <Moon className="mr-2 h-4 w-4" />
                                    {t('dark')}
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
