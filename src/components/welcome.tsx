
'use client';

import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { ListChecks, LogIn, Rocket, Settings, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface WelcomeProps {
    displayName?: string;
    onGetStarted: () => void;
}

export default function Welcome({ displayName, onGetStarted }: WelcomeProps) {
    const { t } = useTranslation();

    // To prevent the case where a user leaves the page open without interacting
    useEffect(() => {
        const timer = setTimeout(() => {
            onGetStarted();
        }, 30000); // Mark as seen after 30 seconds automatically

        return () => clearTimeout(timer);
    }, [onGetStarted]);


    return (
        <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-2xl animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight">
                        {t('welcome', { name: displayName })} to Trade-Dash!
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
                    <div className="text-center">
                        <Button size="lg" onClick={onGetStarted}>
                            <Rocket className="mr-2 h-5 w-5" />
                            {t('gettingStarted')}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
