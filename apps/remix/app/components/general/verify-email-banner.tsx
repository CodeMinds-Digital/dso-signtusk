import { useEffect, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { AlertTriangle } from 'lucide-react';

import { authClient } from '@signtusk/auth/client';
import { ONE_DAY, ONE_SECOND } from '@signtusk/lib/constants/time';
import { Button } from '@signtusk/ui/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@signtusk/ui/primitives/dialog';
import { useToast } from '@signtusk/ui/primitives/use-toast';

export type VerifyEmailBannerProps = {
  email: string;
};

const RESEND_CONFIRMATION_EMAIL_TIMEOUT = 20 * ONE_SECOND;

export const VerifyEmailBanner = ({ email }: VerifyEmailBannerProps) => {
  const { _ } = useLingui();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const onResendConfirmationEmail = async () => {
    if (isPending) {
      return;
    }

    setIsPending(true);

    try {
      setIsButtonDisabled(true);
      await authClient.emailPassword.resendVerifyEmail({ email: email });

      toast({
        title: _(msg`Success`),
        description: _(msg`Verification email sent successfully.`),
      });

      setIsOpen(false);
      setTimeout(() => setIsButtonDisabled(false), RESEND_CONFIRMATION_EMAIL_TIMEOUT);
    } catch (err) {
      setIsButtonDisabled(false);

      toast({
        title: _(msg`Error`),
        description: _(msg`Something went wrong while sending the confirmation email.`),
        variant: 'destructive',
      });
    }

    setIsPending(false);
  };

  useEffect(() => {
    // Check localStorage to see if we've recently automatically displayed the dialog
    // if it was within the past 24 hours, don't show it again
    // otherwise, show it again and update the localStorage timestamp
    const emailVerificationDialogLastShown = localStorage.getItem(
      'emailVerificationDialogLastShown',
    );

    if (emailVerificationDialogLastShown) {
      const lastShownTimestamp = parseInt(emailVerificationDialogLastShown);

      if (Date.now() - lastShownTimestamp < ONE_DAY) {
        return;
      }
    }

    setIsOpen(true);

    localStorage.setItem('emailVerificationDialogLastShown', Date.now().toString());
  }, []);

  return (
    <>
      <div className="border-b border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/30">
        <div className="mx-auto flex max-w-screen-xl items-center justify-center gap-x-3 px-4 py-2.5 text-sm font-medium text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span><Trans>Verify your email address to unlock all features.</Trans></span>
          </div>

          <Button
            variant="ghost"
            className="h-7 rounded-md px-2.5 py-0 text-xs text-amber-800 hover:bg-amber-100 hover:text-amber-900 dark:text-amber-200 dark:hover:bg-amber-900/40"
            disabled={isButtonDisabled}
            onClick={() => setIsOpen(true)}
            size="sm"
          >
            {isButtonDisabled ? (
              <Trans>Email Sent</Trans>
            ) : (
              <Trans>Verify Now</Trans>
            )}
          </Button>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogTitle>
            <Trans>Verify your email address</Trans>
          </DialogTitle>

          <DialogDescription>
            <Trans>
              We've sent a confirmation email to <strong>{email}</strong>. Please check your inbox
              and click the link in the email to verify your account.
            </Trans>
          </DialogDescription>

          <div>
            <Button
              disabled={isButtonDisabled}
              loading={isPending}
              onClick={onResendConfirmationEmail}
            >
              {isPending ? <Trans>Sending...</Trans> : <Trans>Resend Confirmation Email</Trans>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
