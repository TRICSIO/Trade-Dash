
'use client';

import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { ListChecks, LogIn, Settings, UploadCloud } from "lucide-react";
import Link from "next/link";

interface WelcomeProps {
    displayName?: string;
}

export default function Welcome({ displayName }: WelcomeProps) {
    const { t } = useTranslation();

    return (
        <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight">
                        {t('welcome', { name: displayName })} to Trade-Dash!
                    </CardTitle>
                    <CardDescription className="text-lg">
                        {t('welcomeDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <h3 className="text-xl font-semibold text-center">{t('gettingStarted')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        <div className="flex flex-col items-center space-y-2">
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-2">
                               <Settings className="w-8 h-8" />
                            </div>
                            <h4 className="font-semibold">{t('stepOneTitle')}</h4>
                            <p className="text-sm text-muted-foreground">{t('stepOneDescription')}</p>
                             <Button asChild variant="outline" className="mt-2">
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
        </div>
    )
}
