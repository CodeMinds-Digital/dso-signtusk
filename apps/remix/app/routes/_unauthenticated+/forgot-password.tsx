import { Trans } from '@lingui/react/macro';
import { Link } from 'react-router';

import { ForgotPasswordForm } from '~/components/forms/forgot-password';
import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags('Forgot Password');
}

export default function ForgotPasswordPage() {
  return (
    <div className="w-screen max-w-md px-4">
      <div className="border-border bg-card rounded-2xl border p-8 shadow-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            <Trans>Forgot your password?</Trans>
          </h1>

          <p className="text-muted-foreground mt-1.5 text-sm">
            <Trans>
              No worries, it happens! Enter your email and we'll email you a special link to reset
              your password.
            </Trans>
          </p>
        </div>

        <ForgotPasswordForm />

        <p className="text-muted-foreground mt-6 text-center text-sm">
          <Trans>
            Remembered your password?{' '}
            <Link to="/signin" className="text-primary font-medium duration-200 hover:opacity-75">
              Sign In
            </Link>
          </Trans>
        </p>
      </div>
    </div>
  );
}
