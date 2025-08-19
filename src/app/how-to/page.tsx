
'use client';

import ProtectedRoute from "@/components/protected-route";
import AppHeader from "@/components/header";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListChecks, LogIn, Rocket, Settings, UploadCloud, BarChart2, Plus, BrainCircuit, Banknote } from "lucide-react";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

function HowToPageContent() {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader onAddTradeClick={() => {}} onImportClick={() => {}} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 flex justify-center">
                 <Card className="w-full max-w-4xl">
                    <CardHeader className="text-center">
                        <div className="flex justify-center items-center gap-2 mb-2">
                            <Rocket className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight">
                            {t('howToTitle')}
                        </CardTitle>
                        <CardDescription className="text-lg">
                           {t('welcomeDescription')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                                            <Settings className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-semibold text-lg">{t('stepOneTitle')}</h4>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pl-14 text-muted-foreground space-y-4">
                                    <p>{t('stepOneDescription')}</p>
                                    <p>You can add details like a nickname, provider, and account number. Assigning a unique color helps you visually distinguish between accounts on the dashboard.</p>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href="/settings">{t('goToSettings')}</Link>
                                    </Button>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-2">
                                <AccordionTrigger>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                                            <Banknote className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-semibold text-lg">Manage Deposits & Withdrawals</h4>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pl-14 text-muted-foreground space-y-4">
                                   <p>
                                      To keep your account balances perfectly accurate, it's important to log any deposits or withdrawals. On the <Link href="/settings" className="underline font-semibold">Settings</Link> page, find your account and click the 'Manage Account' button.
                                   </p>
                                   <p>This will open a dialog where you can add transactions for:</p>
                                   <ul className="list-disc pl-5 space-y-1">
                                        <li><strong>Deposits:</strong> Any new funds you add to the account.</li>
                                        <li><strong>Withdrawals:</strong> Any funds you take out of the account.</li>
                                   </ul>
                                   <p>These transactions are factored into your "Current Account Balance" on the dashboard.</p>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-3">
                                <AccordionTrigger>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                                            <LogIn className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-semibold text-lg">{t('stepTwoTitle')}</h4>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pl-14 text-muted-foreground space-y-4">
                                   <p>
                                       You have two primary ways to get your trade data into the app.
                                   </p>
                                   <div className="flex items-start gap-4 p-4 border rounded-md">
                                        <Plus className="h-5 w-5 mt-1 text-primary"/>
                                        <div>
                                            <h5 className="font-semibold text-foreground">Add Manually</h5>
                                            <p>Use the 'Add Trade' button in the header to open a form where you can input all the details of a single trade, including instrument, prices, dates, and notes.</p>
                                        </div>
                                   </div>
                                    <div className="flex items-start gap-4 p-4 border rounded-md">
                                        <UploadCloud className="h-5 w-5 mt-1 text-primary"/>
                                        <div>
                                            <h5 className="font-semibold text-foreground">Import from CSV</h5>
                                            <p>Use the 'Import' button to upload a CSV file from your broker. The AI will analyze the file and automatically create all the trades for you, assigning them to your chosen account.</p>
                                        </div>
                                   </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-4">
                                <AccordionTrigger>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                                            <ListChecks className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-semibold text-lg">{t('stepThreeTitle')}</h4>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pl-14 text-muted-foreground space-y-4">
                                     <p>
                                       Once your data is in, you can explore your performance in multiple ways:
                                   </p>
                                   <div className="flex items-start gap-4 p-4 border rounded-md">
                                        <Link href="/" className="flex-shrink-0 mt-1">
                                            <BarChart2 className="h-5 w-5 text-primary"/>
                                        </Link>
                                        <div>
                                            <h5 className="font-semibold text-foreground">Dashboard</h5>
                                            <p>This is your main overview. See your most important Key Performance Indicators (KPIs), your overall equity curve, and a full history of your trades. You can filter the entire dashboard by account.</p>
                                        </div>
                                   </div>
                                    <div className="flex items-start gap-4 p-4 border rounded-md">
                                        <Link href="/analytics" className="flex-shrink-0 mt-1">
                                            <BarChart2 className="h-5 w-5 text-primary"/>
                                        </Link>
                                        <div>
                                            <h5 className="font-semibold text-foreground">Analytics Page</h5>
                                            <p>For a deeper dive, the Analytics page shows you charts on your performance broken down by weekday and by instrument, helping you spot more specific patterns.</p>
                                        </div>
                                   </div>
                                     <div className="flex items-start gap-4 p-4 border rounded-md">
                                       <div className="flex-shrink-0 mt-1">
                                            <BrainCircuit className="h-5 w-5 text-primary"/>
                                        </div>
                                        <div>
                                            <h5 className="font-semibold text-foreground">AI Insights</h5>
                                            <p>On the dashboard, use the 'Generate Suggestions' button. The AI will analyze all your trades and provide personalized, actionable feedback to help you identify strengths and weaknesses in your strategy.</p>
                                        </div>
                                   </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
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
