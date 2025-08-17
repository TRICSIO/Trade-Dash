'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { CandlestickChart, Fingerprint } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { Separator } from '@/components/ui/separator';
import {
    getAuthenticationOptions,
    verifyAuthentication,
} from '@/ai/flows/passkey-flow';
import { startAuthentication } from '@simplewebauthn/browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (error: any) {
      toast({
        title: t('loginFailed'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
        setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setLoading(true);
    try {
        const options = await getAuthenticationOptions();
        const authResponse = await startAuthentication(options);
        const { verified, user } = await verifyAuthentication({
            response: authResponse,
            expectedChallenge: options.challenge,
        });

        if (verified && user) {
             // Manually sign in the user with the custom token from the server
            await signInWithEmailAndPassword(auth, user.email, user.passkey)
            toast({
                title: t('loginSuccessful'),
                description: t('welcomeBack'),
            });
            router.push('/');
        } else {
            throw new Error(t('passkeyVerificationFailed'));
        }
    } catch (error: any) {
        console.error(error);
        const errorMessage = error.name === 'NotAllowedError' ? t('authCancelled') : error.message;
        toast({
            title: t('loginFailed'),
            description: errorMessage,
            variant: 'destructive',
        });
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
                <CandlestickChart className="h-10 w-10 text-primary" />
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                    Trade-Dash
                </h1>
            </div>
            <p className="text-sm italic mb-4">by TRICSIO</p>
          <CardTitle>{t('welcomeBack')}</CardTitle>
          <CardDescription>{t('enterCredentials')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={handlePasskeyLogin} variant="outline" className="w-full">
                <Fingerprint className="mr-2 h-4 w-4" />
                {t('signInWithPasskey')}
            </Button>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        {t('orContinueWith')}
                    </span>
                </div>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('loggingIn') : t('login')}
                </Button>
            </form>
          </div>
           <p className="mt-4 text-center text-sm text-muted-foreground">
            {t('dontHaveAccount')}{' '}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              {t('register')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
