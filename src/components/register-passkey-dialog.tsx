
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Fingerprint, CheckCircle2 } from 'lucide-react';
import { getRegistrationOptions, verifyRegistration } from '@/ai/flows/passkey-flow';
import { startRegistration } from '@simplewebauthn/browser';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import useFirestoreTrades from '@/hooks/use-firestore-trades';

type RegisterPasskeyDialogProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
};

export default function RegisterPasskeyDialog({ isOpen, onOpenChange }: RegisterPasskeyDialogProps) {
  const { user } = useAuth();
  const { displayName } = useFirestoreTrades(user?.uid);
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegisterPasskey = async () => {
    if (!user || !user.email) return;

    setIsLoading(true);
    try {
      // 1. Get registration options from the server
      const options = await getRegistrationOptions({ 
        userId: user.uid, 
        userEmail: user.email,
        displayName: displayName,
      });

      // 2. Prompt the user to create a passkey
      const registrationResponse = await startRegistration(options);

      // 3. Verify the registration with the server
      const { verified } = await verifyRegistration({
        response: registrationResponse,
        expectedChallenge: options.challenge,
        userId: user.uid,
      });

      if (verified) {
        setIsSuccess(true);
        toast({
          title: t('passkeyRegistered'),
          description: t('passkeyRegisteredSuccess'),
        });
      } else {
        throw new Error(t('passkeyVerificationFailed'));
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.name === 'NotAllowedError' ? t('authCancelled') : error.message;
      toast({
        title: t('passkeyRegistrationFailed'),
        description: errorMessage,
        variant: 'destructive',
      });
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state for next time it opens
    setTimeout(() => {
        setIsLoading(false);
        setIsSuccess(false);
    }, 300);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('registerPasskeyTitle')}</DialogTitle>
          <DialogDescription>
            {t('registerPasskeyDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 text-center flex flex-col items-center justify-center gap-4">
            {isSuccess ? (
                <>
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                    <p className="text-lg font-medium">{t('passkeyRegistered')}</p>
                    <p className="text-sm text-muted-foreground">{t('passkeyReady')}</p>
                </>
            ) : (
                <>
                    <Fingerprint className="h-16 w-16 text-primary" />
                    <Button onClick={handleRegisterPasskey} disabled={isLoading}>
                       <Fingerprint className="mr-2 h-4 w-4" /> 
                       {isLoading ? t('registeringPasskey') : t('registerPasskey')}
                    </Button>
                </>
            )}
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
                {isSuccess ? t('close') : t('skipForNow')}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
