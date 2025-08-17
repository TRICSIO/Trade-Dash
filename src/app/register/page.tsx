
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { setDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { CandlestickChart } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName) {
        toast({
            title: t('firstNameRequired'),
            variant: 'destructive',
        });
        return;
    }
    if (password !== confirmPassword) {
      toast({
        title: t('passwordsDoNotMatch'),
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      // NOTE: In a real app, for a passkey-first approach, you might not create a password at all.
      // Here, we create a user with a password, then immediately prompt for passkey registration.
      // The password is required for the client-side Firebase login workaround.
      const userCredential = await createUserWithEmailAndPassword(auth, email, `${email}-passkey`);
      const user = userCredential.user;
      
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        displayName: displayName,
        trades: [],
        startingBalances: {},
        accountSettings: {},
        authenticators: [],
        currentChallenge: null,
      });

      // After creating the user, immediately redirect to prompt for passkey registration.
      router.push('/?action=registerPasskey');
    } catch (error: any) {
      toast({
        title: t('registrationFailed'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
        setLoading(false);
    }
  };

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
          <CardTitle>{t('createAnAccount')}</CardTitle>
          <CardDescription>{t('joinToStart')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="displayName">{t('firstName')}</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Alex"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
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
                autoComplete='username webauthn'
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
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t('confirmPassword')}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('registering') : t('register')}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t('alreadyHaveAccount')}{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              {t('login')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
