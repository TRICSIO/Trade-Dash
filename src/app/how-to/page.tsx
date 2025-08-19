
'use client';

import ProtectedRoute from "@/components/protected-route";
import AppHeader from "@/components/header";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListChecks, LogIn, Rocket, Settings, UploadCloud } from "lucide-react";
import Link from "next/link";
import useFirestoreTrades from "@/hooks/use-firestore-trades";
import { useAuth } from "@/hooks/use-auth";

function HowToPageContent() {
    const { user } = useAuth();
    const { displayName } = useFirestoreTrades(user?.uid);
    const { t } = useTranslation();

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader onAddTradeClick={() => {}} onImportClick={() => {}} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
                 <Card className="w-full max-w-3xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-bold tracking-tight">
                            {t('howToTitle')}
                        </CardTitle>
                        <CardDescription className="text-lg">
                            {t('welcomeDescription')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                            <div className="flex flex-col items-center space-y-2">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-2">
                                <Settings className="w-8 h-8" />
                                </div>
                                <h4 className="font-semibold">{t('stepOneTitle')}</h4>
                                <p className="text-sm text-muted-foreground">{t('stepOneDescription')}</p>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/settings">{t('goToSettings')}</Link>
                                </Button>
                            </div>
                            <div className="flex flex-col items-center space-y-2">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-2">
                                <LogIn className="w-8 h-8" />
                                </div>
                                <h4 className="font-semibold">{t('stepTwoTitle')}</h4>
                                <p className="text-sm text-muted-foreground">{t('stepTwoDescription')}</p>
                            </div>
                            <div className="flex flex-col items-center space-y-2">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-2">
                                <ListChecks className="w-8 h-8" />
                                </div>
                                <h4 className="font-semibold">{t('stepThreeTitle')}</h4>
                                <p className="text-sm text-muted-foreground">{t('stepThreeDescription')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}

export default function HowToPage() {
    return (
        <ProtectedRoute>
            <HowToPageContent />
        </ProtectedRoute>
    )
}
